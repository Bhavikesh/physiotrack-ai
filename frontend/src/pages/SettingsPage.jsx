/**
 * SettingsPage Component
 * User settings and preferences
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, User, Bell, Shield, 
  HelpCircle, Info, Save, Camera
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState({
    notifications: {
      exerciseReminders: true,
      progressReports: true,
      ptMessages: true,
      emailNotifications: false
    },
    privacy: {
      shareDataWithPT: true,
      anonymousAnalytics: true
    },
    camera: {
      resolution: 'high',
      mirrorMode: true,
      showSkeleton: true,
      feedbackVolume: 50
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In real app, save to backend
    localStorage.setItem('userSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ... prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Manage your preferences</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Profile</h2>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={user?.first_name || ''}
                    readOnly
                    className="input-field bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={user?.last_name || ''}
                    readOnly
                    className="input-field bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="input-field bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium capitalize">
                  {user?.user_type}
                </span>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>

            <div className="space-y-4">
              {Object.entries({
                exerciseReminders: 'Exercise Reminders',
                progressReports: 'Weekly Progress Reports',
                ptMessages:  'Messages from Physiotherapist',
                emailNotifications: 'Email Notifications'
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-gray-700">{label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications[key]}
                      onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Camera Settings */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Camera className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Camera & Display</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Resolution
                </label>
                <select
                  value={settings.camera.resolution}
                  onChange={(e) => updateSetting('camera', 'resolution', e.target.value)}
                  className="input-field"
                >
                  <option value="low">Low (480p) - Faster processing</option>
                  <option value="medium">Medium (720p) - Balanced</option>
                  <option value="high">High (1080p) - Best quality</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-medium">Mirror Mode</p>
                  <p className="text-sm text-gray-500">Flip video horizontally for natural movement</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.camera.mirrorMode}
                    onChange={(e) => updateSetting('camera', 'mirrorMode', e. target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-medium">Show Skeleton Overlay</p>
                  <p className="text-sm text-gray-500">Display pose landmarks on video</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.camera.showSkeleton}
                    onChange={(e) => updateSetting('camera', 'showSkeleton', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after: border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback Volume:  {settings.camera.feedbackVolume}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings. camera.feedbackVolume}
                  onChange={(e) => updateSetting('camera', 'feedbackVolume', parseInt(e. target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Privacy</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-medium">Share Data with Physiotherapist</p>
                  <p className="text-sm text-gray-500">Allow your PT to view session data</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.shareDataWithPT}
                    onChange={(e) => updateSetting('privacy', 'shareDataWithPT', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-700 font-medium">Anonymous Analytics</p>
                  <p className="text-sm text-gray-500">Help improve PhysioTrack AI</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.privacy.anonymousAnalytics}
                    onChange={(e) => updateSetting('privacy', 'anonymousAnalytics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after: transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Your privacy matters</p>
                    <p>Video processing happens in your browser.  No video is uploaded to servers.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">About</h2>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Version</span>
                <span className="font-medium text-gray-900">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Build</span>
                <span className="font-medium text-gray-900">2025. 12.15</span>
              </div>
              <div className="flex justify-between">
                <span>License</span>
                <span className="font-medium text-gray-900">MIT</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                Made with ❤️ for better healthcare outcomes
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-4">
            <button
              onClick={handleSave}
              className={`w-full btn-primary flex items-center justify-center gap-2 ${
                saved ? 'bg-green-600 hover:bg-green-700' : ''
              }`}
            >
              <Save className="w-5 h-5" />
              {saved ? 'Settings Saved!  ✓' : 'Save Settings'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}