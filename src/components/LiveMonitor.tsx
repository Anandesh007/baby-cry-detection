import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useMediaCapture } from '../hooks/useMediaCapture';
import { analyzeMedia } from '../services/api';
import type { AnalysisResponse } from '../types';
import DetectionCard from './DetectionCard';

export default function LiveMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentDetection, setCurrentDetection] = useState<AnalysisResponse | null>(null);
  const [lastSmsStatus, setLastSmsStatus] = useState<string | null>(null);
  const [voiceAlertsEnabled, setVoiceAlertsEnabled] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamsRef = useRef<{ video: MediaStream | null; audio: MediaStream | null }>({
    video: null,
    audio: null,
  });

  const { startCapture, stopCapture, captureSegment } = useMediaCapture({
    audioDuration: 4000,
    videoDuration: 4000,
  });

  const playVoiceAlert = (message: string) => {
    if (!voiceAlertsEnabled) return;

    try {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to play voice alert:', err);
    }
  };

  const handleStartMonitoring = async () => {
    try {
      setError(null);
      const { videoStream, audioStream } = await startCapture();

      streamsRef.current = { video: videoStream, audio: audioStream };

      if (videoRef.current && videoStream) {
        videoRef.current.srcObject = videoStream;
      }

      setIsMonitoring(true);

      // Start 4-second capture loop
      intervalRef.current = setInterval(async () => {
        if (streamsRef.current.video && streamsRef.current.audio) {
          await performAnalysis(streamsRef.current.video, streamsRef.current.audio);
        }
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start monitoring');
    }
  };

  const handleStopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    stopCapture();
    streamsRef.current = { video: null, audio: null };

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsMonitoring(false);
  };

  const performAnalysis = async (videoStream: MediaStream, audioStream: MediaStream) => {
    try {
      setIsAnalyzing(true);
      setError(null);

      const { audioBlob, videoBlob } = await captureSegment(videoStream, audioStream);

      const result = await analyzeMedia(audioBlob, videoBlob, new Date());

      setCurrentDetection(result);

      // Handle cry detection
      if (result.status === 'cry') {
        playVoiceAlert('Baby crying detected, please check.');
        setLastSmsStatus('SMS alert sent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };


  useEffect(() => {
    return () => {
      handleStopMonitoring();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Live Baby Monitor</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Webcam Preview */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Camera Feed</h3>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isMonitoring && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <CameraOff className="w-16 h-16 text-gray-600" />
                </div>
              )}
              {isAnalyzing && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Analyzing...
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                {!isMonitoring ? (
                  <button
                    onClick={handleStartMonitoring}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <Camera className="w-5 h-5" />
                    Start Monitoring
                  </button>
                ) : (
                  <button
                    onClick={handleStopMonitoring}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <CameraOff className="w-5 h-5" />
                    Stop Monitoring
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="voice-alerts"
                  checked={voiceAlertsEnabled}
                  onChange={(e) => setVoiceAlertsEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="voice-alerts" className="text-sm text-gray-700">
                  Enable voice alerts
                </label>
              </div>
            </div>
          </div>

          {/* Detection Card */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Detection Status</h3>
            <DetectionCard detection={currentDetection} />

            {/* SMS Status Panel */}
            {lastSmsStatus && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 text-sm">SMS Status</h4>
                    <p className="text-blue-700 text-sm mt-1">{lastSmsStatus}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 text-sm">Error</h4>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
