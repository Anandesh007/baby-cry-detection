"""
Notification Service - SMS alerts via Twilio
"""

import os
from datetime import datetime
from twilio.rest import Client
from typing import Dict, Optional

class NotificationService:
    def __init__(self):
        """Initialize Twilio client if credentials are available."""
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.from_number = os.getenv('TWILIO_FROM_NUMBER')
        self.notify_number = os.getenv('NOTIFY_NUMBER', '+919342600413')

        self.configured = bool(
            self.account_sid and
            self.auth_token and
            self.from_number and
            self.account_sid != 'your_account_sid_here'
        )

        if self.configured:
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                print(f"Failed to initialize Twilio client: {e}")
                self.configured = False
        else:
            self.client = None

    def send_cry_alert(
        self,
        cry_reason: str,
        activity: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ) -> Dict:
        """
        Send SMS alert for baby cry detection.

        Args:
            cry_reason: Reason for crying (hunger, pain, attention, gas)
            activity: Baby activity (sleeping, sitting)
            timestamp: Detection timestamp

        Returns:
            Dict with notification status
        """
        if not self.configured:
            return {
                "provider": "twilio",
                "delivered": False,
                "error": "Twilio not configured. Add credentials to backend/.env",
                "sid": None
            }

        try:
            # Format timestamp
            if timestamp is None:
                timestamp = datetime.now()

            time_str = timestamp.strftime("%I:%M %p")

            # Build message
            message = f"Alert: Baby crying due to {cry_reason} detected at {time_str}."

            if activity:
                message += f" Baby is {activity}."

            # Send SMS
            sms = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=self.notify_number
            )

            return {
                "provider": "twilio",
                "delivered": True,
                "error": None,
                "sid": sms.sid,
                "message": message,
                "status": sms.status
            }

        except Exception as e:
            print(f"Failed to send SMS: {e}")
            return {
                "provider": "twilio",
                "delivered": False,
                "error": str(e),
                "sid": None
            }

    def send_test_sms(self, message: str = "Test notification from Baby Monitor") -> Dict:
        """Send a test SMS for admin verification."""
        if not self.configured:
            return {
                "provider": "twilio",
                "delivered": False,
                "error": "Twilio not configured"
            }

        try:
            sms = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=self.notify_number
            )

            return {
                "provider": "twilio",
                "delivered": True,
                "error": None,
                "sid": sms.sid,
                "message": message,
                "status": sms.status
            }

        except Exception as e:
            return {
                "provider": "twilio",
                "delivered": False,
                "error": str(e)
            }
