import { useState, useRef, useCallback } from 'react';

interface MediaCaptureOptions {
  audioDuration?: number;
  videoDuration?: number;
}

export function useMediaCapture(options: MediaCaptureOptions = {}) {
  const { audioDuration = 4000, videoDuration = 4000 } = options;

  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);

  const startCapture = useCallback(async () => {
    try {
      setError(null);

      // Get video stream (camera)
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });

      // Get audio stream (microphone)
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
        video: false,
      });

      videoStreamRef.current = videoStream;
      audioStreamRef.current = audioStream;

      setIsCapturing(true);
      return { videoStream, audioStream };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }

    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      audioRecorderRef.current.stop();
    }

    setIsCapturing(false);
  }, []);

  const captureSegment = useCallback(
    async (
      videoStream: MediaStream,
      audioStream: MediaStream
    ): Promise<{ audioBlob: Blob; videoBlob: Blob }> => {
      return new Promise((resolve, reject) => {
        const audioChunks: Blob[] = [];
        const videoChunks: Blob[] = [];

        let audioBlob: Blob | null = null;
        let videoBlob: Blob | null = null;

        const checkComplete = () => {
          if (audioBlob && videoBlob) {
            resolve({ audioBlob, videoBlob });
          }
        };

        // Setup audio recorder
        const audioRecorder = new MediaRecorder(audioStream, {
          mimeType: 'audio/webm',
        });

        audioRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        audioRecorder.onstop = () => {
          audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          checkComplete();
        };

        audioRecorder.onerror = () => {
          reject(new Error('Audio recording failed'));
        };

        // Setup video recorder
        const videoRecorder = new MediaRecorder(videoStream, {
          mimeType: 'video/webm',
        });

        videoRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            videoChunks.push(event.data);
          }
        };

        videoRecorder.onstop = () => {
          videoBlob = new Blob(videoChunks, { type: 'video/webm' });
          checkComplete();
        };

        videoRecorder.onerror = () => {
          reject(new Error('Video recording failed'));
        };

        // Start recording
        audioRecorder.start();
        videoRecorder.start();

        audioRecorderRef.current = audioRecorder;
        videoRecorderRef.current = videoRecorder;

        // Stop after duration
        setTimeout(() => {
          if (audioRecorder.state !== 'inactive') {
            audioRecorder.stop();
          }
        }, audioDuration);

        setTimeout(() => {
          if (videoRecorder.state !== 'inactive') {
            videoRecorder.stop();
          }
        }, videoDuration);
      });
    },
    [audioDuration, videoDuration]
  );

  return {
    isCapturing,
    error,
    videoStream: videoStreamRef.current,
    audioStream: audioStreamRef.current,
    startCapture,
    stopCapture,
    captureSegment,
  };
}
