# Quick Start Guide

This guide will help you get the Baby Monitor AI application running in minutes.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ Python 3.9+ installed (`python3 --version`)
- ✅ npm installed (`npm --version`)
- ✅ pip installed (`pip --version`)

## Step-by-Step Setup

### 1. Start the Frontend (Terminal 1)

In the project root directory:

```bash
npm install
npm run dev
```

The frontend will start at http://localhost:5173 (or next available port).

**Keep this terminal running.**

### 2. Start the Backend (Terminal 2)

Open a new terminal and navigate to the backend directory:

```bash
cd backend
```

Create and activate virtual environment:

```bash
# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask server:

```bash
python app.py
```

The backend API will start at http://localhost:5000

**Keep this terminal running.**

### 3. Open the Application

1. Open your browser and go to http://localhost:5173
2. You should see the "Baby Monitor AI" interface
3. Click "Start Monitoring" to begin
4. Allow camera and microphone access when prompted
5. The app will start analyzing 4-second segments automatically

## Testing the System

### Test Real-time Monitoring

1. Navigate to the "Live Monitor" tab
2. Click "Start Monitoring"
3. Allow camera/microphone permissions
4. Watch the detection card update every 4 seconds

### Test Manual Upload

1. Click "Upload Audio" or "Upload Video"
2. Select a test file
3. View the analysis results

### View Reports

1. Click the "Report History" tab
2. See all past detections
3. Check SMS delivery status

### View Daily Summary

1. Click the "Daily Summary" tab
2. View activity breakdown (sleep, cry, active time)
3. See detection statistics

## Configuring SMS Alerts (Optional)

To enable SMS notifications when baby is crying:

1. Sign up for a Twilio account at https://www.twilio.com/
2. Get your credentials from the Twilio Console:
   - Account SID
   - Auth Token
   - Twilio phone number
3. Edit `backend/.env` file:
   ```
   TWILIO_ACCOUNT_SID=your_actual_sid_here
   TWILIO_AUTH_TOKEN=your_actual_token_here
   TWILIO_FROM_NUMBER=+1234567890
   NOTIFY_NUMBER=+919342600413
   ```
4. Restart the backend server
5. Test SMS by clicking the test notification button

## Troubleshooting

### Camera/Microphone Not Working

- **Chrome recommended**: Works best in Chrome browser
- **HTTPS/Localhost required**: Browser security requires secure context
- **Check permissions**: Allow camera and microphone in browser settings
- **Try different browser**: If issues persist, try Firefox or Edge

### Backend Not Connecting

- **Check port**: Ensure nothing else is using port 5000
- **Firewall**: Temporarily disable firewall to test
- **CORS errors**: Verify Flask-CORS is installed
- **Check logs**: Look at terminal output for error messages

### Python Dependencies Fail to Install

- **Update pip**: `pip install --upgrade pip`
- **System dependencies**: Some packages (like librosa, opencv) need system libraries
  - macOS: `brew install portaudio ffmpeg`
  - Ubuntu: `sudo apt-get install portaudio19-dev python3-dev ffmpeg`
  - Windows: Install Visual C++ Build Tools

### No Detections Showing

- **Backend running**: Verify Flask server is active at http://localhost:5000/api/health
- **Check browser console**: Look for JavaScript errors (F12 in Chrome)
- **Database connection**: Ensure Supabase credentials are correct in `.env`
- **Network errors**: Check if backend is reachable

## What's Happening Under the Hood

1. **Every 4 seconds**:
   - Browser records 4s of audio and video
   - Files are sent to Flask backend at `/api/analyze`

2. **Backend processing**:
   - Audio analyzer checks for baby cries
   - Video analyzer detects baby presence and activity
   - Results are combined into a single response
   - Report is saved to Supabase database

3. **If baby is crying**:
   - SMS alert sent via Twilio
   - Voice alert played in browser (if enabled)
   - Detection displayed in red alert card

4. **All detections**:
   - Stored in database with timestamp
   - Visible in Report History
   - Counted in Daily Summary

## Next Steps

- **Test with real audio/video**: Use actual baby recordings
- **Adjust thresholds**: Modify detection sensitivity in AI modules
- **Replace AI models**: Integrate production models (see README.md)
- **Customize SMS messages**: Edit notification templates
- **Add users**: Implement authentication for multi-user support

## Production Deployment

Before deploying to production:

1. ✅ Replace placeholder AI models with trained production models
2. ✅ Enable HTTPS on both frontend and backend
3. ✅ Set up proper authentication
4. ✅ Configure production database
5. ✅ Add rate limiting to API endpoints
6. ✅ Set up monitoring and logging
7. ✅ Test with real baby audio/video extensively

## Support

For detailed documentation, see the main [README.md](./README.md) file.

For backend-specific setup, see [backend/README.md](./backend/README.md).
