# Rep Counting Analysis - All Exercises

## Overview
This document details the rep counting mechanism and quality criteria for all exercises in PhysioTrack AI.

---

## Rep Counting Criteria

### Total Reps vs Quality Reps

**Total Reps**: Counted when movement goes through complete state cycle:
- `resting` → `raising` → `top` → `lowering` → `resting`

**Quality Reps**: Subset of total reps that meet form criteria:
- ❌ NO high-severity form issues
- ❌ Maximum 1 medium-severity issue
- ✅ Allows multiple low-severity issues

---

## Exercise Details

### 1. **Shoulder Flexion**
- **Target ROM**: 180°
- **Acceptable Range**: 160° - 180°
- **Primary Angle**: shoulder_angle (points 11, 13, 15)
- **Secondary Angle**: elbow_angle (points 13, 15, 17)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= 160°
- Top → Lowering: After 2 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria** (to be counted as quality rep):
- ✅ No trunk lean (max 10° deviation from vertical) - HIGH severity if violated
- ✅ Elbow remains straight (max 15° bend) - MEDIUM severity if violated
- ✅ Proper ROM achieved and held for 2 seconds - LOW severity if insufficient hold

**Velocity Requirements**:
- Lifting: 30-60°/sec (MEDIUM penalty if exceeded)
- Lowering: 20-40°/sec (MEDIUM penalty if exceeded)

---

### 2. **Knee Extension (Quad Set)**
- **Target ROM**: 0° (full extension)
- **Acceptable Range**: -5° to +5°
- **Primary Angle**: knee_angle (points 23, 25, 27)
- **Secondary Angle**: hip_angle (points 23, 11, 13)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= -5°
- Top → Lowering: After 5 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria**:
- ✅ Hip stays level (no lifting) - HIGH severity if violated
- ✅ Hold at full extension for 5 seconds - LOW severity if insufficient
- ✅ Controlled movement throughout - MEDIUM severity if jerky

**Velocity Requirements**:
- Lifting: 20-40°/sec
- Lowering: 15-30°/sec

---

### 3. **Hip Abduction (Standing)**
- **Target ROM**: 45°
- **Acceptable Range**: 35° - 50°
- **Primary Angle**: hip_abduction_angle (points 23, 25, 27)
- **Secondary Angle**: knee_angle (points 23, 25, 27)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= 35°
- Top → Lowering: After 2 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria**:
- ✅ No trunk shift (max 10° lean) - HIGH severity if violated
- ✅ Knee stays straight (max 10° bend) - MEDIUM severity if violated
- ✅ Proper ROM achieved - LOW severity if ROM deficit

**Velocity Requirements**:
- Lifting: 25-50°/sec
- Lowering: 20-40°/sec

---

### 4. **Squat**
- **Target ROM**: 90° (knee flexion)
- **Acceptable Range**: 80° - 100°
- **Primary Angle**: knee_flexion (points 23, 25, 27)
- **Secondary Angles**: hip_flexion (11, 23, 25), ankle_dorsiflexion (25, 27, 31)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= 80°
- Top → Lowering: After 1 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria**:
- ✅ No knee valgus (inward collapse) - HIGH severity if violated
- ✅ Limited forward lean (max 45°) - MEDIUM severity if violated
- ✅ Full ROM achieved - LOW severity if insufficient depth

**Velocity Requirements**:
- Lifting (eccentric): 30-60°/sec
- Lowering (concentric): 25-50°/sec

---

### 5. **Ankle Pump (Dorsiflexion/Plantarflexion)**
- **Target ROM**: 20° (dorsiflexion)
- **Acceptable Range**: 15° - 25°
- **Primary Angle**: ankle_angle (points 25, 27, 31)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= 15°
- Top → Lowering: After 1 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria**:
- ✅ Knee remains still (max 5° movement) - MEDIUM severity if violated
- ✅ Consistent, rhythmic motion - LOW severity if irregular
- ✅ Full ROM achieved - LOW severity if limited

**Velocity Requirements**:
- Faster pumping motion: 40-80°/sec (optimal for circulation)

---

### 6. **Cervical Flexion (Chin Tuck)**
- **Target ROM**: 50° (from neutral)
- **Acceptable Range**: 40° - 60°
- **Primary Angle**: neck_angle (points 7, 0, 8)
- **Secondary Angle**: head_tilt_angle (11, 7, 0)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= 40°
- Top → Lowering: After 3 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria**:
- ✅ Shoulders relaxed (max 15° elevation) - HIGH severity if violated
- ✅ Controlled gentle motion (max 70° flexion) - MEDIUM severity if forced
- ✅ Full hold duration (3 seconds) - LOW severity if insufficient hold

**Velocity Requirements**:
- Slow, gentle motion: 15-30°/sec (neck movements must be controlled)

---

### 7. **Cervical Rotation (Head Turn)**
- **Target ROM**: 80° (from center)
- **Acceptable Range**: 70° - 90°
- **Primary Angle**: rotation_angle (11, 0, 12)
- **Secondary Angle**: vertical_alignment (7, 0, 8)

**State Transitions**:
- Resting → Raising: When angle > 30°
- Raising → Top: When angle >= 70°
- Top → Lowering: After 2 second hold + angle decreases
- Lowering → Resting: When angle < 30° ✅ REP COUNTED

**Quality Criteria**:
- ✅ No trunk rotation (max 15° deviation) - HIGH severity if violated
- ✅ Shoulder stays level (max 10° elevation on one side) - MEDIUM severity if violated
- ✅ Chin stays level (max 10° tilt) - MEDIUM severity if tilted
- ✅ Full ROM achieved - LOW severity if limited range

**Velocity Requirements**:
- Smooth, controlled: 20-40°/sec

---

## Quality Scoring Algorithm

### Penalty System
- **High Severity Issues**: -15 points
- **Medium Severity Issues**: -5 points each
- **Low Severity Issues**: -2 points each
- **ROM Deficit**: Up to -15 points (max deduction)

### Example Scenarios

**Scenario 1: Perfect Rep**
```
- No feedback issues
- Full ROM achieved
- Proper hold duration
Quality Score: 100/100 ✅ QUALITY REP
```

**Scenario 2: Good Rep with Minor Issues**
```
- 1 Medium severity issue (elbow slightly bent)
- Full ROM achieved
- Proper hold duration
Quality Score: 95/100 ✅ QUALITY REP (< 2 medium issues)
```

**Scenario 3: Poor Rep with Major Issues**
```
- 1 High severity issue (significant trunk lean)
- Achieved ROM only 150° (incomplete)
- Proper hold duration
Quality Score: 70/100 ❌ NOT QUALITY (has high severity issue)
```

**Scenario 4: Incomplete Rep**
```
- No form issues
- ROM only 150° (incomplete)
- Poor hold duration
Quality Score: 80/100 ❌ NOT QUALITY (ROM deficit + timing issues)
```

---

## Rep Counting Flow

```
Frame Detection
     ↓
Calculate Angles (all joints for the exercise)
     ↓
Check Compensations (assign severity)
     ↓
Check Velocity (assign severity)
     ↓
Update State Machine
     ↓
  Is Rep Complete? (returned to resting)
     ↓ YES
  Increment Total Rep Count
     ↓
  Check Quality Criteria:
  - HIGH severity issues? → NOT QUALITY
  - MEDIUM issues > 1? → NOT QUALITY
  - Otherwise → QUALITY REP ✅
     ↓
  Return: rep_count, quality_reps, quality_score
```

---

## Key Differences: Total Reps vs Quality Reps

| Metric | Total Reps | Quality Reps |
|--------|-----------|--------------|
| **Requirement** | Complete state cycle | Complete cycle + good form |
| **High Severity Issues** | Allowed | ❌ Not allowed |
| **Medium Severity Issues** | Allowed | Max 1 allowed |
| **Low Severity Issues** | Allowed | Allowed |
| **ROM Achievement** | Any movement | Must reach acceptable range |
| **Use Case** | Volume tracking | Form quality tracking |
| **Patient Goal** | Complete prescribed reps | Maintain proper technique |

---

## Logging Output

Each rep completion shows:
```
✅ REP #5 COMPLETED! | ⭐ QUALITY REP! (Total: 5 reps, 4 quality)
```

Or if form issues:
```
✅ REP #6 COMPLETED! | ⚠️ Not quality (Issues: 1 high-severity, 0 medium-severity) (Total: 6 reps, 4 quality)
```

---

## Notes

- Quality reps should typically be 60-90% of total reps for good form
- If quality reps ≈ total reps: Patient has excellent form
- If quality reps << total reps: Patient needs form correction
- Backend logs all angles, feedback, and severity to help therapists coach patients
