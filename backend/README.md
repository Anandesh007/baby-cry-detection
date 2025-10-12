# Backend Setup Guide

## Quick Start

1. **Create virtual environment**:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Configure Twilio (Optional)**:
Edit `.env` and add your Twilio credentials:
```
TWILIO_ACCOUNT_SID=your_actual_sid
TWILIO_AUTH_TOKEN=your_actual_token
TWILIO_FROM_NUMBER=your_twilio_number
```

4. **Start the server**:
```bash
python app.py
```

The API will be available at http://localhost:5000

## Testing the API

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Test SMS (requires Twilio setup)
```bash
curl -X POST http://localhost:5000/api/notify-test \
  -H "Content-Type: application/json" \
  -d '{"message": "Test from Baby Monitor"}'
```

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/analyze` - Analyze audio/video (multipart/form-data)
- `GET /api/reports` - Get reports list
- `GET /api/reports/:id` - Get single report
- `POST /api/notify-test` - Send test SMS
- `GET /api/summary/daily` - Get daily summary

## Dependencies

- **Flask**: Web framework
- **Flask-CORS**: Cross-origin resource sharing
- **librosa**: Audio analysis and feature extraction
- **OpenCV**: Video processing and computer vision
- **NumPy**: Numerical operations
- **Twilio**: SMS notifications
- **Supabase**: Database client

## Troubleshooting

### Import Errors
Ensure virtual environment is activated and all dependencies are installed.

### Port Already in Use
Change `FLASK_PORT` in `.env` file.

### Database Connection Issues
Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env` file.
