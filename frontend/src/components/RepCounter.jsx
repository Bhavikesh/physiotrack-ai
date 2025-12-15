/**
 * RepCounter Component
 * Standalone rep counter display
 */

import { Award } from 'lucide-react';

export default function RepCounter({ current, target, quality }) {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Reps</h3>
        <Award className="w-6 h-6" />
      </div>

      <div className="text-center">
        <div className="text-6xl font-bold mb-2">
          {current}
          <span className="text-2xl opacity-75">/{target}</span>
        </div>

        <div className="mt-4 bg-white bg-opacity-20 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-3 text-sm opacity-90">
          {quality} quality reps ({Math.round((quality/Math.max(current, 1)) * 100)}%)
        </div>
      </div>
    </div>
  );
}