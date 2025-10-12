# Baby Monitor AI - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Frontend)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React Application (Vite + TypeScript + Tailwind CSS)    │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ Live        │  │ Report       │  │ Daily          │  │  │
│  │  │ Monitor     │  │ History      │  │ Summary        │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────┘  │  │
│  │         │                 │                   │          │  │
│  │         └─────────────────┴───────────────────┘          │  │
│  │                           │                               │  │
│  │                    ┌──────▼───────┐                      │  │
│  │                    │ API Service  │                      │  │
│  │                    └──────────────┘                      │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                 │
│  ┌────────────────────────────▼───────────────────────────┐   │
│  │         MediaCapture Hook (Audio + Video)              │   │
│  │  - 4-second recording loop                             │   │
│  │  - WebRTC MediaRecorder API                            │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │ HTTP (multipart/form-data)
                               │ POST /api/analyze
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Flask Backend (Python)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      API Endpoints                        │  │
│  │  /api/analyze  │  /api/reports  │  /api/summary/daily    │  │
│  └────────┬──────────────────┬────────────────┬─────────────┘  │
│           │                  │                │                 │
│  ┌────────▼─────┐   ┌────────▼──────┐   ┌────▼─────────────┐  │
│  │   Audio      │   │    Video      │   │   Database       │  │
│  │   Analyzer   │   │   Analyzer    │   │   Service        │  │
│  │              │   │               │   │   (Supabase)     │  │
│  │  - librosa   │   │  - OpenCV     │   └──────────────────┘  │
│  │  - Feature   │   │  - Face       │            │             │
│  │    extract   │   │    detect     │   ┌────────▼─────────┐  │
│  │  - Cry       │   │  - Motion     │   │  Notification    │  │
│  │    classify  │   │    analysis   │   │  Service         │  │
│  └──────────────┘   └───────────────┘   │  (Twilio SMS)    │  │
│                                          └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      reports table                        │  │
│  │  - id, timestamp, audio_result, video_result             │  │
│  │  - combined_message, notified, notification_status       │  │
│  │  - RLS enabled for security                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Real-time Monitoring Flow

```
User clicks "Start Monitoring"
    │
    ▼
Request camera + microphone permissions
    │
    ▼
Start 4-second capture loop
    │
    ├─── Record 4s audio (WebM)
    └─── Record 4s video (WebM)
         │
         ▼
    Bundle as FormData
         │
         ▼
    POST to /api/analyze
         │
         ▼
    Flask receives files
         │
         ├─── Audio Analyzer
         │    ├─── Load audio (librosa)
         │    ├─── Extract features (mel-spectrogram, pitch, ZCR)
         │    ├─── Detect cry (energy + spectral analysis)
         │    └─── Classify reason (hunger/pain/attention/gas)
         │
         └─── Video Analyzer
              ├─── Extract frames (OpenCV)
              ├─── Detect presence (face detection)
              └─── Classify activity (motion analysis -> sleeping/sitting)
              │
              ▼
    Combine results
              │
              ├─── No baby? → Return "no_baby" status
              ├─── Baby present, not crying? → Return "present" + activity
              └─── Baby crying? → Return "cry" + reason + activity
                   │
                   └─── Send SMS via Twilio
                        │
                        ▼
    Save report to Supabase
              │
              ▼
    Return JSON response to frontend
              │
              ▼
    Update DetectionCard UI
              │
              ├─── Show "No detection" (gray)
              ├─── Show "Baby present" (green)
              └─── Show "Baby crying" (red, pulsing) + play voice alert
```

### 2. Report History Flow

```
User navigates to "Report History" tab
    │
    ▼
GET /api/reports?limit=50&offset=0
    │
    ▼
Database Service queries Supabase
    │
    ▼
SELECT * FROM reports ORDER BY timestamp DESC
    │
    ▼
Return JSON array of reports
    │
    ▼
Render list with status badges
    ├─── "No Baby" (gray)
    ├─── "Crying" (red) + SMS status
    ├─── "Sleeping" (blue)
    └─── "Awake" (green)
```

### 3. Daily Summary Flow

```
User navigates to "Daily Summary" tab
    │
    ▼
GET /api/summary/daily
    │
    ▼
Database Service queries reports for today
    │
    ▼
Calculate statistics:
    ├─── Count sleeping detections → sleep_minutes = count * 4 / 60
    ├─── Count crying detections → cry_minutes = count * 4 / 60
    └─── Count sitting detections → active_minutes = count * 4 / 60
         │
         ▼
Return JSON summary
    │
    ▼
Render stats cards + bar chart
```

## Component Architecture

### Frontend Components

```
App.tsx
├── LiveMonitor.tsx
│   ├── useMediaCapture hook
│   │   ├── startCapture()
│   │   ├── stopCapture()
│   │   └── captureSegment()
│   ├── DetectionCard.tsx
│   └── API Service (analyzeMedia)
├── ReportHistory.tsx
│   └── API Service (getReports)
└── DailySummary.tsx
    └── API Service (getDailySummary)
```

### Backend Modules

```
app.py (Flask routes)
├── /api/analyze → analyze()
│   ├── file_handler.save_uploaded_file()
│   ├── audio_analyzer.analyze()
│   ├── video_analyzer.analyze()
│   ├── combine_results()
│   ├── notification_service.send_cry_alert()
│   └── database_service.save_report()
├── /api/reports → get_reports()
│   └── database_service.get_reports()
├── /api/reports/:id → get_report()
│   └── database_service.get_report_by_id()
├── /api/notify-test → notify_test()
│   └── notification_service.send_test_sms()
└── /api/summary/daily → daily_summary()
    └── database_service.get_daily_summary()
```

## AI Module Architecture

### Audio Analyzer (Placeholder → Production)

**Current (Placeholder)**:
```python
audio_analyzer.py
├── analyze(audio_path)
│   ├── Load with librosa
│   ├── _detect_cry()
│   │   ├── Calculate RMS energy
│   │   ├── Calculate zero crossing rate
│   │   └── Combined heuristic score
│   └── _classify_cry_reason()
│       ├── Extract pitch (librosa.piptrack)
│       ├── Calculate spectral rolloff
│       └── Rule-based classification
```

**Production Integration**:
```python
audio_analyzer.py
├── __init__() → Load trained models
│   ├── cry_detector_model = load_model('cry_detector.h5')
│   └── reason_classifier_model = load_model('cry_classifier.h5')
├── analyze(audio_path)
│   ├── Load with librosa
│   ├── _detect_cry()
│   │   ├── Extract mel-spectrogram
│   │   ├── Run CNN/YAMNet inference
│   │   └── Return prediction + confidence
│   └── _classify_cry_reason()
│       ├── Extract MFCC features
│       ├── Run classifier (CNN/RNN/Transformer)
│       └── Map to {hunger, pain, attention, gas}
```

### Video Analyzer (Placeholder → Production)

**Current (Placeholder)**:
```python
video_analyzer.py
├── analyze(video_path)
│   ├── Load frames with OpenCV
│   ├── _detect_presence()
│   │   ├── Face detection (Haar Cascade)
│   │   └── Count faces in frames
│   └── _classify_activity()
│       ├── Calculate frame differences
│       ├── Motion score (mean difference)
│       └── Threshold-based classification
```

**Production Integration**:
```python
video_analyzer.py
├── __init__() → Initialize models
│   ├── face_detection = MediaPipe Face Detection
│   ├── pose_detection = MediaPipe Pose
│   └── activity_classifier = load_model('activity_cnn.h5')
├── analyze(video_path)
│   ├── Load frames with OpenCV
│   ├── _detect_presence()
│   │   ├── Run MediaPipe face/pose detection
│   │   ├── Check baby-specific features (size, proportions)
│   │   └── Return presence + confidence
│   └── _classify_activity()
│       ├── Extract pose landmarks
│       ├── Run pose classifier CNN/ResNet
│       └── Classify sleeping (horizontal, eyes closed) vs sitting
```

## Security Architecture

### Database Security (Supabase RLS)

```sql
reports table
├── Row Level Security: ENABLED
├── SELECT Policy: "Public read access"
│   └── USING (true) → Anyone can read
└── INSERT Policy: "Public insert access"
    └── WITH CHECK (true) → Anyone can insert
```

**Note**: In production, implement authentication-based policies:
```sql
SELECT POLICY: USING (auth.uid() = user_id)
INSERT POLICY: WITH CHECK (auth.uid() = user_id)
```

### API Security

Current:
- CORS enabled for development (allow all origins)
- No rate limiting
- No authentication

Production requirements:
- CORS restricted to specific origins
- Rate limiting per IP (e.g., 100 requests/minute)
- JWT authentication
- API key for backend services
- File upload size limits (enforced)
- Input validation and sanitization

## Performance Considerations

### Frontend Optimization

- **4-second capture loop**: Balance between real-time and server load
- **Video compression**: WebM format with reasonable bitrate
- **Debounced uploads**: Prevent request flooding
- **Component lazy loading**: React.lazy for route-based splitting

### Backend Optimization

- **File cleanup**: Temporary files deleted after analysis
- **Connection pooling**: Supabase client reuse
- **Async processing**: Consider celery/RQ for heavy AI tasks
- **Caching**: Cache model inference results for similar inputs

### Database Optimization

- **Indexes**: timestamp, notified status
- **Pagination**: Limit query results
- **Archive old reports**: Move to cold storage after 30 days

## Scalability Path

### Current (Single Server)

```
1 Frontend Instance (Vite dev server)
1 Backend Instance (Flask)
1 Database (Supabase)
1 SMS Provider (Twilio)
```

### Production (Scalable)

```
Frontend:
├── Build static assets (npm run build)
├── Deploy to CDN (Vercel, Netlify, Cloudflare)
└── Multiple edge locations

Backend:
├── Containerize with Docker
├── Deploy multiple instances behind load balancer
├── Auto-scaling based on CPU/memory
└── Separate AI processing workers (Celery + Redis)

Database:
├── Supabase (managed PostgreSQL)
├── Connection pooling (PgBouncer)
└── Read replicas for reports/history

Storage:
├── Object storage for audio/video (S3/Supabase Storage)
└── CDN for cached content
```

## Monitoring & Observability

### Recommended Tools

- **Application Monitoring**: Sentry, DataDog
- **Log Aggregation**: Logtail, Papertrail
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Performance**: Lighthouse, Web Vitals
- **Error Tracking**: Frontend + Backend error logging

### Key Metrics

- Detection accuracy rate
- Average response time (capture → result)
- SMS delivery rate
- False positive/negative rates
- System uptime
- API error rates

## Deployment Checklist

- [ ] Replace placeholder AI models
- [ ] Enable authentication
- [ ] Configure production database
- [ ] Set up HTTPS/SSL certificates
- [ ] Configure CORS for production domain
- [ ] Set up monitoring and alerts
- [ ] Add rate limiting
- [ ] Implement backup strategy
- [ ] Load test with realistic traffic
- [ ] Document API for external integrations
