/**
 * Landing Page
 * Marketing/login page for PhysioTrack AI
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Eye, TrendingUp, Users, CheckCircle, ArrowRight } from 'lucide-react';

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userType, setUserType] = useState('patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        result = await register({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          user_type: userType
        });
      }

      if (result.success) {
        // Redirect based on user type
        if (result.user?. user_type === 'physiotherapist' || userType === 'physiotherapist') {
          navigate('/pt-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(result.error || 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Quick demo login
  const handleDemoLogin = async (type) => {
    setLoading(true);
    const demoCredentials = type === 'patient' 
      ? { email: 'demo@physiotrack.ai', password: 'demo1234' }
      : { email: 'pt@physiotrack.ai', password: 'pt1234' };
    
    const result = await login(demoCredentials. email, demoCredentials.password);
    if (result.success) {
      navigate(type === 'patient' ? '/dashboard' : '/pt-dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 rounded-lg p-2">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PhysioTrack AI</h1>
                <p className="text-sm text-gray-500">Home Physiotherapy Assistant</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left:  Value Proposition */}
          <div>
            <div className="inline-block mb-4">
              <span className="bg-primary-100 text-primary-800 px-4 py-2 rounded-full text-sm font-semibold">
                🚀 AI-Powered Recovery
              </span>
            </div>

            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Recover Faster with
              <span className="text-primary-600"> Real-Time Guidance</span>
            </h2>

            <p className="text-xl text-gray-600 mb-8">
              Computer vision technology that tracks your movements, corrects your form instantly, 
              and helps you recover safely at home.
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {[
                { icon: Eye, text: 'Real-time pose detection with 30+ FPS tracking' },
                { icon: TrendingUp, text: 'Track progress with detailed analytics' },
                { icon:  Users, text: 'Remote monitoring by your physiotherapist' },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <feature.icon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Demo Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => handleDemoLogin('patient')}
                className="btn-primary flex items-center gap-2"
                disabled={loading}
              >
                Try Patient Demo
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDemoLogin('physiotherapist')}
                className="btn-secondary"
                disabled={loading}
              >
                Try PT Demo
              </button>
            </div>
          </div>

          {/* Right: Login/Register Form */}
          <div className="card max-w-md mx-auto w-full">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`flex-1 pb-3 font-semibold transition-colors ${
                  isLogin ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'
                }`}
                onClick={() => setIsLogin(true)}
              >
                Login
              </button>
              <button
                className={`flex-1 pb-3 font-semibold transition-colors ${
                  !isLogin ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'
                }`}
                onClick={() => setIsLogin(false)}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      I am a
                    </label>
                    <select
                      value={userType}
                      onChange={(e) => setUserType(e.target.value)}
                      className="input-field"
                    >
                      <option value="patient">Patient</option>
                      <option value="physiotherapist">Physiotherapist</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' :  'Create Account')}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Demo credentials available above for quick testing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why PhysioTrack AI? 
          </h3>

          <div className="grid md: grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Clinical Accuracy',
                description: 'Based on APTA guidelines with ±3° joint angle precision'
              },
              {
                icon: Eye,
                title: 'Privacy First',
                description: 'Pose processing happens in your browser - no video uploaded'
              },
              {
                icon: TrendingUp,
                title: 'Track Progress',
                description: 'Detailed analytics show ROM improvement and quality trends'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 PhysioTrack AI.  Built for better healthcare outcomes.
          </p>
        </div>
      </footer>
    </div>
  );
}