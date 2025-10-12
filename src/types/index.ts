export interface AudioResult {
  status: 'cry' | 'no_cry' | 'error';
  reason?: 'hunger' | 'pain' | 'attention' | 'gas';
  confidence: number;
  error?: string;
}

export interface VideoResult {
  presence: boolean;
  activity?: 'sleeping' | 'sitting';
  confidence: number;
  reason?: string;
}

export interface NotificationStatus {
  provider: string;
  delivered: boolean;
  error: string | null;
  sid: string | null;
  message?: string;
  status?: string;
}

export interface Report {
  id: string;
  timestamp: string;
  audio_result: AudioResult;
  video_result: VideoResult;
  combined_message?: string;
  notified: boolean;
  notification_status?: NotificationStatus;
  created_at: string;
}

export interface AnalysisResponse {
  status: 'no_baby' | 'present' | 'cry';
  message?: string;
  activity?: 'sleeping' | 'sitting';
  activity_confidence?: number;
  cry_reason?: 'hunger' | 'pain' | 'attention' | 'gas';
  cry_confidence?: number;
  combined_message?: string;
  timestamp: string;
  report_id?: string;
}

export interface DailySummary {
  date: string;
  sleep_minutes: number;
  cry_minutes: number;
  active_minutes: number;
  total_detections: number;
  no_baby_detections: number;
  breakdown: {
    sleeping: number;
    crying: number;
    sitting: number;
    no_baby: number;
  };
}
