/**
 * Voice Settings Component
 * Controls for voice feedback configuration
 */

import { Volume2, Zap, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function VoiceSettings({ voiceSystem, isOpen, onClose }) {
  const [rate, setRate] = useState(1.0);
  const [volume, setVolume] = useState(0.9);
  const [enableVoice, setEnableVoice] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('voiceSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setRate(settings.rate || 1.0);
        setVolume(settings.volume || 0.9);
        setEnableVoice(settings.enabled !== false);
        
        // Apply to voice system
        if (voiceSystem) {
          voiceSystem.setRate(settings.rate || 1.0);
          voiceSystem.setVolume(settings.volume || 0.9);
        }
      } catch (error) {
        console.error('Error loading voice settings:', error);
      }
    }
  }, [voiceSystem]);

  // Save settings whenever they change
  const saveSettings = (newSettings) => {
    const settings = {
      rate: newSettings.rate !== undefined ? newSettings.rate : rate,
      volume: newSettings.volume !== undefined ? newSettings.volume : volume,
      enabled: newSettings.enabled !== undefined ? newSettings.enabled : enableVoice
    };
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
  };

  const handleRateChange = (e) => {
    const newRate = parseFloat(e.target.value);
    setRate(newRate);
    voiceSystem?.setRate(newRate);
    saveSettings({ rate: newRate });
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    voiceSystem?.setVolume(newVolume);
    saveSettings({ volume: newVolume });
  };

  const handleEnableChange = (e) => {
    const enabled = e.target.checked;
    setEnableVoice(enabled);
    saveSettings({ enabled });
  };

  const testVoice = () => {
    voiceSystem?.speak('Test voice feedback system', { priority: 'high' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full sm:max-w-md border border-gray-700 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-purple-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Voice Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Enable/Disable Voice */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={enableVoice}
                onChange={handleEnableChange}
                className="w-5 h-5 accent-blue-500 cursor-pointer"
              />
              <span className="text-white font-medium">Enable Voice Feedback</span>
            </label>
            <p className="text-sm text-gray-400">
              Receive real-time voice guidance during exercises
            </p>
          </div>

          {enableVoice && (
            <>
              {/* Speech Rate */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <label className="text-white font-medium">Speech Rate</label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={rate}
                    onChange={handleRateChange}
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm w-12 text-right">
                    {rate.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Slow</span>
                  <span>Normal</span>
                  <span>Fast</span>
                </div>
              </div>

              {/* Volume */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-400" />
                  <label className="text-white font-medium">Volume</label>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm w-12 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>

              {/* Test Button */}
              <button
                onClick={testVoice}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Volume2 className="w-4 h-4" />
                Test Voice
              </button>

              {/* Feedback Types */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 space-y-2">
                <h4 className="text-white font-medium text-sm">Voice Feedback Types</h4>
                <ul className="space-y-1.5 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Form corrections (high priority)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Rep counting announcements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Encouragement messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Rest period notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>Set and session completion</span>
                  </li>
                </ul>
              </div>

              {/* Info */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  💡 <strong>Tip:</strong> Enable voice feedback to focus on proper form while the system guides you with real-time audio cues.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-700/50">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
