import { AlertTriangle, Baby, Moon, User } from 'lucide-react';
import type { AnalysisResponse } from '../types';

interface DetectionCardProps {
  detection: AnalysisResponse | null;
}

export default function DetectionCard({ detection }: DetectionCardProps) {
  if (!detection) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">
          <Baby className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-500 font-medium">Waiting for detection...</p>
        <p className="text-gray-400 text-sm mt-1">Start monitoring to begin analysis</p>
      </div>
    );
  }

  if (detection.status === 'no_baby') {
    return (
      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-6 text-center">
        <div className="text-gray-400 mb-2">
          <Baby className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 font-semibold text-lg">No detection</p>
        <p className="text-gray-500 text-sm mt-1">{detection.message || 'No baby detected'}</p>
        <p className="text-gray-400 text-xs mt-2">
          {new Date(detection.timestamp).toLocaleTimeString()}
        </p>
      </div>
    );
  }

  if (detection.status === 'cry') {
    const reasonEmoji = {
      hunger: '🍼',
      pain: '😢',
      attention: '👋',
      gas: '💨',
    }[detection.cry_reason || 'attention'];

    return (
      <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 animate-pulse-slow">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-red-900 font-bold text-lg mb-2">Baby Crying Detected!</h3>

            <div className="space-y-2">
              <div className="bg-white rounded-lg p-3">
                <p className="text-red-800 font-medium text-sm mb-1">
                  {reasonEmoji} {detection.combined_message}
                </p>

                <div className="flex items-center gap-4 mt-2 text-xs text-red-700">
                  <span>Cry: {Math.round((detection.cry_confidence || 0) * 100)}%</span>
                  {detection.activity && (
                    <>
                      <span>•</span>
                      <span>Activity: {Math.round((detection.activity_confidence || 0) * 100)}%</span>
                    </>
                  )}
                </div>
              </div>

              {detection.activity && (
                <div className="flex items-center gap-2 text-sm text-red-800">
                  {detection.activity === 'sleeping' ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span>Baby is {detection.activity}</span>
                </div>
              )}
            </div>

            <p className="text-red-600 text-xs mt-3">
              Detected at {new Date(detection.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (detection.status === 'present') {
    const activityIcon = detection.activity === 'sleeping' ? Moon : User;
    const ActivityIcon = activityIcon;

    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Baby className="w-8 h-8 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-green-900 font-bold text-lg mb-2">Baby Present</h3>

            <div className="space-y-2">
              {detection.activity && (
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-800">
                    <ActivityIcon className="w-5 h-5" />
                    <span className="font-medium">
                      Baby is {detection.activity}
                    </span>
                  </div>
                  <p className="text-green-700 text-xs mt-2">
                    Confidence: {Math.round((detection.activity_confidence || 0) * 100)}%
                  </p>
                </div>
              )}

              <p className="text-green-700 text-sm">No crying detected</p>
            </div>

            <p className="text-green-600 text-xs mt-3">
              Detected at {new Date(detection.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
