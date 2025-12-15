-- PhysioTrack AI Database Schema
-- PostgreSQL 15+

-- Enable TimescaleDB extension (optional, for better time-series performance)
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('patient', 'physiotherapist')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- ============================================================================
-- PATIENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_pt_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    injury_type VARCHAR(255),
    injury_date DATE,
    surgery_date DATE,
    current_week INTEGER DEFAULT 1,
    notes TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_pt FOREIGN KEY (assigned_pt_id) REFERENCES users(user_id)
);

CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_patients_pt ON patients(assigned_pt_id);

-- ============================================================================
-- EXERCISES
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercises (
    exercise_id SERIAL PRIMARY KEY,
    exercise_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    target_rom DECIMAL(5,2),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500)
);

CREATE INDEX idx_exercises_code ON exercises(exercise_code);
CREATE INDEX idx_exercises_category ON exercises(category);

-- ============================================================================
-- EXERCISE SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS exercise_sessions (
    session_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    total_reps INTEGER DEFAULT 0,
    quality_reps INTEGER DEFAULT 0,
    average_quality_score DECIMAL(5,2),
    completed BOOLEAN DEFAULT FALSE,
    notes TEXT
);

CREATE INDEX idx_sessions_patient ON exercise_sessions(patient_id);
CREATE INDEX idx_sessions_exercise ON exercise_sessions(exercise_id);
CREATE INDEX idx_sessions_start_time ON exercise_sessions(start_time);
CREATE INDEX idx_sessions_patient_time ON exercise_sessions(patient_id, start_time);

-- ============================================================================
-- MOVEMENT DATA (Time-Series)
-- ============================================================================

CREATE TABLE IF NOT EXISTS movement_data (
    movement_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES exercise_sessions(session_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    frame_number INTEGER,
    joint_angles JSONB NOT NULL,
    landmarks JSONB,
    quality_score DECIMAL(5,2)
);

CREATE INDEX idx_movement_session ON movement_data(session_id);
CREATE INDEX idx_movement_timestamp ON movement_data(timestamp);
CREATE INDEX idx_movement_session_time ON movement_data(session_id, timestamp);

-- Optional: Convert to TimescaleDB hypertable for better performance
-- SELECT create_hypertable('movement_data', 'timestamp', if_not_exists => TRUE);

-- ============================================================================
-- FEEDBACK LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_logs (
    feedback_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES exercise_sessions(session_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    feedback_type VARCHAR(50),
    feedback_category VARCHAR(50),
    feedback_message TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    current_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    acknowledged BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_feedback_session ON feedback_logs(session_id);
CREATE INDEX idx_feedback_timestamp ON feedback_logs(timestamp);
CREATE INDEX idx_feedback_severity ON feedback_logs(severity);

-- ============================================================================
-- PROGRESS METRICS (Aggregated)
-- ============================================================================

CREATE TABLE IF NOT EXISTS progress_metrics (
    metric_id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    average_rom DECIMAL(5,2),
    max_rom DECIMAL(5,2),
    total_sessions INTEGER DEFAULT 0,
    adherence_rate DECIMAL(5,2),
    quality_score_trend DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_patient_exercise_week UNIQUE (patient_id, exercise_id, week_number)
);

CREATE INDEX idx_metrics_patient ON progress_metrics(patient_id);
CREATE INDEX idx_metrics_week ON progress_metrics(week_number);

-- ============================================================================
-- SEED DATA:  Insert Default Exercises
-- ============================================================================

INSERT INTO exercises (exercise_code, name, description, category, difficulty, target_rom) VALUES
('shoulder_flexion', 'Shoulder Flexion', 'Raise arm forward and upward to full range', 'upper_body', 'beginner', 180. 00),
('knee_extension', 'Knee Extension (Quad Set)', 'Straighten knee while seated, activate quadriceps', 'lower_body', 'beginner', 0.00),
('hip_abduction', 'Hip Abduction (Standing)', 'Lift leg out to the side while standing', 'lower_body', 'beginner', 45.00),
('squat', 'Squat', 'Lower body by bending knees and hips', 'lower_body', 'intermediate', 90.00),
('ankle_pump', 'Ankle Pump', 'Point toes up and down while seated', 'lower_body', 'beginner', 20.00)
ON CONFLICT (exercise_code) DO NOTHING;

-- ============================================================================
-- DEMO DATA: Create Demo User & Patient
-- ============================================================================

-- Demo Patient User (password: demo1234)
INSERT INTO users (email, password_hash, user_type, first_name, last_name) VALUES
('demo@physiotrack.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5LL2aGRzl/dTC', 'patient', 'Demo', 'Patient')
ON CONFLICT (email) DO NOTHING;

-- Demo Physiotherapist (password: pt1234)
INSERT INTO users (email, password_hash, user_type, first_name, last_name) VALUES
('pt@physiotrack.ai', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5LL2aGRzl/dTC', 'physiotherapist', 'Dr.  Sarah', 'Johnson')
ON CONFLICT (email) DO NOTHING;

-- Link demo patient to PT
INSERT INTO patients (user_id, assigned_pt_id, injury_type, current_week)
SELECT 
    (SELECT user_id FROM users WHERE email = 'demo@physiotrack.ai'),
    (SELECT user_id FROM users WHERE email = 'pt@physiotrack.ai'),
    'Rotator Cuff Tear',
    3
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS: Useful Analytics Views
-- ============================================================================

-- View: Recent patient activity
CREATE OR REPLACE VIEW recent_patient_activity AS
SELECT 
    p. patient_id,
    u.first_name || ' ' || u.last_name AS patient_name,
    e.name AS exercise_name,
    es.start_time,
    es.total_reps,
    es. quality_reps,
    es.average_quality_score
FROM exercise_sessions es
JOIN patients p ON es.patient_id = p. patient_id
JOIN users u ON p.user_id = u. user_id
JOIN exercises e ON es.exercise_id = e. exercise_id
WHERE es.completed = TRUE
ORDER BY es.start_time DESC;

-- View:  PT Dashboard Summary
CREATE OR REPLACE VIEW pt_patient_summary AS
SELECT 
    p. patient_id,
    u. first_name || ' ' || u.last_name AS patient_name,
    p.injury_type,
    p.current_week,
    COUNT(DISTINCT es.session_id) AS total_sessions,
    MAX(es.start_time) AS last_session,
    ROUND(AVG(es.average_quality_score), 1) AS avg_quality
FROM patients p
JOIN users u ON p.user_id = u. user_id
LEFT JOIN exercise_sessions es ON p.patient_id = es.patient_id AND es.completed = TRUE
GROUP BY p.patient_id, u.first_name, u.last_name, p.injury_type, p.current_week;

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE users IS 'Base user accounts for both patients and physiotherapists';
COMMENT ON TABLE patients IS 'Extended patient information and injury details';
COMMENT ON TABLE exercises IS 'Exercise definitions and metadata';
COMMENT ON TABLE exercise_sessions IS 'Individual exercise workout sessions';
COMMENT ON TABLE movement_data IS 'Time-series joint angle and pose data';
COMMENT ON TABLE feedback_logs IS 'Real-time corrective feedback given during exercises';
COMMENT ON TABLE progress_metrics IS 'Aggregated weekly progress statistics';

-- ============================================================================
-- GRANTS (Adjust for your user)
-- ============================================================================

-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO physiotrack;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO physiotrack;