# Baby Monitor AI

A full-stack, real-time baby monitoring application that analyzes 4-second audio and video segments to detect baby presence, activity (sleeping/sitting), and crying patterns with reason classification (hunger, pain, attention, gas).

## Features

- **Real-time Monitoring**: Continuous 4-second capture and analysis loop
- **Baby Presence Detection**: Video analysis to detect if baby is in frame
- **Activity Classification**: Identifies if baby is sleeping or sitting
- **Cry Detection**: Audio analysis to detect baby cries
- **Cry Reason Classification**: Categorizes cries as hunger, pain, attention, or gas
- **SMS Alerts**: Twilio integration for instant notifications when baby is crying
- **Voice Alerts**: Optional browser text-to-speech alerts
- **Report History**: Complete log of all detections with timestamps
- **Daily Summary**: Visual breakdown of sleep, cry, and active time
- **Upload Support**: Manual audio/video file uploads for analysis

## Architecture

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Database**: Supabase
- **Features**:
  - Real-time webcam and microphone capture
  - 4-second recording loop
  - Live detection display
  - Report history viewer
  - Daily activity summary with charts

### Backend
- **Framework**: Flask (Python)
- **AI Modules**: Placeholder models (easily replaceable)
  - Audio: librosa-based audio analysis with feature extraction
  - Video: OpenCV-based video analysis with face/motion detection
- **Database**: Supabase (PostgreSQL)
- **Notifications**: Twilio SMS
- **Ports**:
  - Frontend: Vite default (usually 5173)
  - Backend: http://localhost:5000

### Database Schema

**reports** table:
- `id`: UUID primary key
- `timestamp`: Detection timestamp
- `audio_result`: JSON (status, reason, confidence)
- `video_result`: JSON (presence, activity, confidence)
- `combined_message`: Human-readable detection summary
- `notified`: Boolean indicating if SMS was sent
- `notification_status`: JSON with SMS delivery details
- `created_at`: Record creation timestamp

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- pip (Python package manager)

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173 (or the next available port)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create a Python virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Configure Twilio (optional but recommended for SMS alerts):
   - Sign up at https://www.twilio.com/
   - Get your Account SID, Auth Token, and Twilio phone number
   - Edit `backend/.env` and add your credentials:
   ```
   TWILIO_ACCOUNT_SID=your_actual_sid
   TWILIO_AUTH_TOKEN=your_actual_token
   TWILIO_FROM_NUMBER=your_twilio_number
   ```

5. Start the Flask server:
```bash
python app.py
```

The backend API will be available at http://localhost:5000

## Usage

### Real-time Monitoring

1. Open the application in your browser
2. Click "Start Monitoring" on the Live Monitor tab
3. Allow camera and microphone access when prompted
4. The app will automatically capture and analyze 4-second segments
5. Detection results appear immediately in the Detection Status card
6. When crying is detected, an SMS alert is sent (if Twilio is configured)

### Detection Behavior

- **No Baby Detected**: Shows "No detection" message, no SMS sent
- **Baby Present (Not Crying)**: Shows baby activity (sleeping/sitting) with confidence
- **Baby Crying**: Shows cry reason and activity, sends SMS alert, plays voice alert (if enabled)

### Manual Upload

1. Click "Upload Audio" or "Upload Video" buttons
2. Select a file from your device
3. Analysis results will be displayed

### View Reports

1. Navigate to the "Report History" tab
2. View all past detections with timestamps
3. See SMS delivery status for cry alerts
4. Click "Refresh" to update the list

### Daily Summary

1. Navigate to the "Daily Summary" tab
2. View total sleep, cry, and active time
3. See visual breakdown with percentage distribution
4. Review detection counts by category

## API Endpoints

### POST /api/analyze
Analyze audio and video segments.

**Request**: multipart/form-data
- `audio`: Audio file (webm, mp3, wav)
- `video`: Video file (webm, mp4)
- `timestamp`: ISO timestamp (optional)

**Response**:
```json
{
  "status": "cry",
  "cry_reason": "hunger",
  "cry_confidence": 0.87,
  "activity": "sitting",
  "activity_confidence": 0.82,
  "combined_message": "Baby crying due to hunger while sitting.",
  "timestamp": "2025-10-12T20:45:00Z",
  "report_id": "uuid"
}
```

### GET /api/reports
Get paginated list of reports.

**Query params**: `limit` (default 50), `offset` (default 0)

### GET /api/reports/:id
Get single report by ID.

### POST /api/notify-test
Send test SMS notification.

**Body**: `{ "message": "Test message" }`

### GET /api/summary/daily
Get daily activity summary.

**Query params**: `date` (ISO date, optional, defaults to today)

## Replacing Placeholder AI Models

The application ships with simple heuristic-based placeholder models that work out-of-the-box. To integrate production models:

### Audio Analysis (backend/ai_modules/audio_analyzer.py)

Replace the `AudioAnalyzer` class methods:

1. **For cry detection**:
   - Load your trained model (e.g., YAMNet, Wav2Vec2, custom CNN)
   - Extract mel-spectrograms or other features
   - Run inference and return predictions

2. **For cry reason classification**:
   - Use advanced features (MFCC, pitch, formants)
   - Load classifier model
   - Map predictions to {hunger, pain, attention, gas}

Example integration point:
```python
def _detect_cry(self, audio):
    # Load your model
    model = tf.keras.models.load_model('cry_detector.h5')

    # Extract features
    mel_spec = librosa.feature.melspectrogram(y=audio, sr=self.sample_rate)

    # Run inference
    prediction = model.predict(mel_spec)

    return is_crying, confidence
```

### Video Analysis (backend/ai_modules/video_analyzer.py)

Replace the `VideoAnalyzer` class methods:

1. **For presence detection**:
   - Use MediaPipe Face/Pose detection
   - Or load a baby detection CNN/YOLO model
   - Process frames and detect baby-specific features

2. **For activity classification**:
   - Extract pose landmarks using MediaPipe
   - Use CNN or ResNet for pose classification
   - Classify as sleeping (horizontal, closed eyes) or sitting (upright)

Example integration point:
```python
def _detect_presence(self, frames):
    # Use MediaPipe or custom model
    mp_face = mediapipe.solutions.face_detection
    detector = mp_face.FaceDetection()

    # Process frames
    for frame in frames:
        results = detector.process(frame)
        # ... detection logic

    return has_presence, confidence
```

## SMS Configuration

The app uses Twilio for SMS notifications. To enable:

1. Create a Twilio account at https://www.twilio.com/
2. Get your credentials from the Twilio Console
3. Update `backend/.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_FROM_NUMBER=+1234567890
   NOTIFY_NUMBER=+919342600413
   ```

SMS Format:
```
Alert: Baby crying due to hunger detected at 08:45 PM. Baby is sitting.
```

## Project Structure

```
project/
├── backend/
│   ├── ai_modules/
│   │   ├── audio_analyzer.py    # Audio analysis with placeholder model
│   │   └── video_analyzer.py    # Video analysis with placeholder model
│   ├── services/
│   │   ├── database_service.py  # Supabase integration
│   │   └── notification_service.py  # Twilio SMS service
│   ├── utils/
│   │   └── file_handler.py      # File upload handling
│   ├── app.py                   # Flask API server
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Backend configuration
├── src/
│   ├── components/
│   │   ├── LiveMonitor.tsx      # Real-time monitoring UI
│   │   ├── DetectionCard.tsx    # Detection display
│   │   ├── ReportHistory.tsx    # Report list viewer
│   │   └── DailySummary.tsx     # Daily activity summary
│   ├── hooks/
│   │   └── useMediaCapture.ts   # Audio/video capture hook
│   ├── services/
│   │   └── api.ts               # Backend API client
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── lib/
│   │   └── supabase.ts          # Supabase client
│   └── App.tsx                  # Main application
└── README.md
```

## Troubleshooting

### Camera/Microphone Access Denied
- Ensure you're using HTTPS or localhost
- Check browser permissions for camera and microphone
- Try a different browser (Chrome recommended)

### Backend Connection Failed
- Verify Flask server is running on port 5000
- Check CORS configuration in `backend/app.py`
- Ensure no firewall is blocking local connections

### SMS Not Sending
- Verify Twilio credentials in `backend/.env`
- Check Twilio account balance
- Confirm phone number is verified in Twilio
- Review notification logs in Report History

### No Detections Appearing
- Check browser console for errors
- Verify Flask server logs for analysis errors
- Ensure audio/video files are valid formats
- Check database connection in Supabase

## Development

### Run Frontend in Development Mode
```bash
npm run dev
```

### Run Backend in Development Mode
```bash
cd backend
source venv/bin/activate
python app.py
```

### Type Checking
```bash
npm run typecheck
```

### Build for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Technologies Used

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React (icons)
- Supabase Client

### Backend
- Flask 3.0
- Flask-CORS
- librosa (audio processing)
- OpenCV (video processing)
- NumPy
- Twilio (SMS)
- Supabase Python Client

### Database
- Supabase (PostgreSQL)
- Row Level Security enabled

## License

This project is provided as-is for demonstration purposes.

## Notes

- Placeholder AI models are designed for development and testing
- Replace with production models before deploying to production
- SMS alerts require active Twilio account with credits
- Browser media capture requires HTTPS or localhost
- 4-second segments are optimal for real-time performance vs accuracy
