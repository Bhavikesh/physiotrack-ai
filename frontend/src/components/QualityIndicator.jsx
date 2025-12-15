/**
 * QualityIndicator Component
 * Visual quality score meter
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function QualityIndicator({ score, trend = 0 }) {
  const getQualityLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color:  'bg-green-500', textColor: 'text-green-600' };
    if (score >= 75) return { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    if (score >= 60) return { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { label: 'Poor', color: 'bg-red-500', textColor: 'text-red-600' };
  };

  const quality = getQualityLevel(score);

  const getTrendIcon = () => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600 font-medium">Form Quality</span>
        {getTrendIcon()}
      </div>

      {/* Circular Progress */}
      <div className="relative w-32 h-32 mx-auto mb-3">
        <svg className="transform -rotate-90 w-32 h-32">
          {/* Background circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="64"
            cy="64"
            r="56"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 56}`}
            strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
            className={quality.textColor}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Score Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-3xl font-bold ${quality.textColor}`}>
              {Math.round(score)}
            </div>
            <div className="text-xs text-gray-500">/ 100</div>
          </div>
        </div>
      </div>

      {/* Quality Label */}
      <div className="text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${quality.color} text-white`}>
          {quality.label}
        </span>
      </div>
    </div>
  );
}