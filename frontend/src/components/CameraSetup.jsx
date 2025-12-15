/**
 * CameraSetup Component
 * Guides user to position themselves correctly
 */

import { User, MoveVertical, MoveHorizontal } from 'lucide-react';

export default function CameraSetup({ isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center pointer-events-none">
      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-2xl p-8 max-w-md text-center">
        <User className="w-16 h-16 mx-auto mb-4 text-white" />
        
        <h2 className="text-2xl font-bold text-white mb-4">
          Position Yourself
        </h2>
        
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3">
            <MoveHorizontal className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-white font-medium">Full Body Visible</p>
              <p className="text-gray-300 text-sm">
                Stand 6-8 feet from camera so your whole body is in frame
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MoveVertical className="w-5 h-5 text-primary-400 flex-shrink-0 mt-1" />
            <div>
              <p className="text-white font-medium">Center Yourself</p>
              <p className="text-gray-300 text-sm">
                Position yourself in the center of the frame
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 flex-shrink-0 mt-1">
              <div className="w-full h-full bg-primary-400 rounded-full" />
            </div>
            <div>
              <p className="text-white font-medium">Good Lighting</p>
              <p className="text-gray-300 text-sm">
                Ensure you're well-lit and background is clear
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-primary-500 bg-opacity-20 rounded-lg">
          <p className="text-primary-200 text-sm">
            💡 Tip: You'll see a green skeleton overlay when positioned correctly
          </p>
        </div>
      </div>
    </div>
  );
}