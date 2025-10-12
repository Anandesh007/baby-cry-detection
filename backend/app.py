"""
Flask Backend Server for Baby Monitor Application
Provides REST API for audio/video analysis, notifications, and reporting
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from ai_modules.audio_analyzer import AudioAnalyzer
from ai_modules.video_analyzer import VideoAnalyzer
from services.notification_service import NotificationService
from services.database_service import DatabaseService
from utils.file_handler import (
    init_upload_folder,
    save_uploaded_file,
    cleanup_file
)

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize services
audio_analyzer = AudioAnalyzer()
video_analyzer = VideoAnalyzer()
notification_service = NotificationService()
database_service = DatabaseService()

# Initialize upload folder
init_upload_folder()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })


@app.route('/api/analyze', methods=['POST'])
def analyze():
    """
    Analyze audio and video for baby detection.

    Expects multipart/form-data with:
    - audio: audio file
    - video: video file
    - timestamp: ISO timestamp (optional)
    """
    audio_path = None
    video_path = None

    try:
        # Get files from request
        audio_file = request.files.get('audio')
        video_file = request.files.get('video')
        timestamp_str = request.form.get('timestamp')

        if not audio_file or not video_file:
            return jsonify({
                "error": "Both audio and video files are required"
            }), 400

        # Parse timestamp
        if timestamp_str:
            try:
                timestamp = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
            except:
                timestamp = datetime.now()
        else:
            timestamp = datetime.now()

        # Save uploaded files
        audio_path, audio_error = save_uploaded_file(audio_file, 'audio')
        if audio_error:
            return jsonify({"error": audio_error}), 400

        video_path, video_error = save_uploaded_file(video_file, 'video')
        if video_error:
            cleanup_file(audio_path)
            return jsonify({"error": video_error}), 400

        # Analyze audio
        audio_result = audio_analyzer.analyze(audio_path)

        # Analyze video
        video_result = video_analyzer.analyze(video_path)

        # Combine results
        response = combine_results(
            audio_result,
            video_result,
            timestamp
        )

        # Save to database
        report_data = {
            "timestamp": timestamp.isoformat(),
            "audio_result": audio_result,
            "video_result": video_result,
            "combined_message": response.get('combined_message'),
            "notified": False,
            "notification_status": None
        }

        # Send notification if crying detected
        if response.get('status') == 'cry' and video_result.get('presence'):
            notification_result = notification_service.send_cry_alert(
                cry_reason=response.get('cry_reason'),
                activity=response.get('activity'),
                timestamp=timestamp
            )

            report_data['notified'] = notification_result.get('delivered', False)
            report_data['notification_status'] = notification_result

        # Save report
        saved_report = database_service.save_report(report_data)
        response['report_id'] = saved_report.get('id')

        return jsonify(response), 200

    except Exception as e:
        print(f"Error in analyze endpoint: {e}")
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

    finally:
        # Clean up temporary files
        cleanup_file(audio_path)
        cleanup_file(video_path)


def combine_results(audio_result: dict, video_result: dict, timestamp: datetime) -> dict:
    """
    Combine audio and video analysis results.

    Returns standardized response based on detection state.
    """
    response = {
        "timestamp": timestamp.isoformat()
    }

    # Check baby presence first
    if not video_result.get('presence'):
        response['status'] = 'no_baby'
        response['message'] = 'No baby detected'
        return response

    # Baby is present
    activity = video_result.get('activity')
    activity_confidence = video_result.get('confidence', 0)

    # Check if crying
    if audio_result.get('status') == 'cry':
        cry_reason = audio_result.get('reason')
        cry_confidence = audio_result.get('confidence', 0)

        # Build combined message
        combined_message = f"Baby crying due to {cry_reason}"
        if activity:
            combined_message += f" while {activity}"
        combined_message += "."

        response['status'] = 'cry'
        response['cry_reason'] = cry_reason
        response['cry_confidence'] = cry_confidence
        response['activity'] = activity
        response['activity_confidence'] = activity_confidence
        response['combined_message'] = combined_message

    else:
        # Baby present but not crying
        response['status'] = 'present'
        response['activity'] = activity
        response['activity_confidence'] = activity_confidence

    return response


@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get paginated list of reports."""
    try:
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        reports = database_service.get_reports(limit=limit, offset=offset)

        return jsonify({
            "reports": reports,
            "limit": limit,
            "offset": offset,
            "count": len(reports)
        }), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch reports",
            "details": str(e)
        }), 500


@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    """Get single report by ID."""
    try:
        report = database_service.get_report_by_id(report_id)

        if not report:
            return jsonify({"error": "Report not found"}), 404

        return jsonify(report), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to fetch report",
            "details": str(e)
        }), 500


@app.route('/api/notify-test', methods=['POST'])
def notify_test():
    """Send test SMS notification."""
    try:
        data = request.get_json() or {}
        message = data.get('message', 'Test notification from Baby Monitor')

        result = notification_service.send_test_sms(message)

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to send test notification",
            "details": str(e)
        }), 500


@app.route('/api/summary/daily', methods=['GET'])
def daily_summary():
    """Get daily summary of detections."""
    try:
        date_str = request.args.get('date')

        if date_str:
            try:
                date = datetime.fromisoformat(date_str)
            except:
                return jsonify({"error": "Invalid date format"}), 400
        else:
            date = None

        summary = database_service.get_daily_summary(date)

        return jsonify(summary), 200

    except Exception as e:
        return jsonify({
            "error": "Failed to generate summary",
            "details": str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
