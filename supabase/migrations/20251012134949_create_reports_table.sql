/*
  # Create reports table for baby monitoring

  1. New Tables
    - `reports`
      - `id` (uuid, primary key) - Unique report identifier
      - `timestamp` (timestamptz) - When the detection occurred
      - `audio_result` (jsonb) - Audio analysis results (status, reason, confidence)
      - `video_result` (jsonb) - Video analysis results (presence, activity, confidence)
      - `combined_message` (text) - Human-readable detection summary
      - `notified` (boolean) - Whether SMS notification was sent
      - `notification_status` (jsonb) - SMS delivery details (provider, sid, delivered, error)
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on `reports` table
    - Add policy for public read access (monitoring dashboard)
    - Add policy for service role to insert reports

  3. Indexes
    - Index on timestamp for efficient date-range queries
    - Index on notified status for alert tracking
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp timestamptz NOT NULL,
  audio_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  video_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  combined_message text,
  notified boolean DEFAULT false,
  notification_status jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_timestamp ON reports(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_notified ON reports(notified) WHERE notified = true;
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow public read access for the monitoring dashboard
CREATE POLICY "Public read access to reports"
  ON reports
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public insert for report creation (backend service)
CREATE POLICY "Public insert access to reports"
  ON reports
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Comment on table and columns
COMMENT ON TABLE reports IS 'Stores baby monitoring detection reports with audio/video analysis results and notification status';
COMMENT ON COLUMN reports.audio_result IS 'Audio analysis: {status: cry|no_cry, reason: hunger|pain|attention|gas, confidence: 0-1}';
COMMENT ON COLUMN reports.video_result IS 'Video analysis: {presence: boolean, activity: sleeping|sitting, confidence: 0-1}';
COMMENT ON COLUMN reports.notification_status IS 'SMS notification details: {provider, sid, delivered, error, message}';
