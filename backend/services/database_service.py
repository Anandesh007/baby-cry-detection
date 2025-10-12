"""
Database Service - Supabase integration for storing reports and alerts
"""

import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from supabase import create_client, Client

class DatabaseService:
    def __init__(self):
        """Initialize Supabase client."""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_ANON_KEY')

        if not supabase_url or not supabase_key:
            raise ValueError("Supabase credentials not found in environment")

        self.client: Client = create_client(supabase_url, supabase_key)

    def save_report(self, report_data: Dict) -> Dict:
        """
        Save analysis report to database.

        Args:
            report_data: Report data including audio/video results

        Returns:
            Saved report with ID
        """
        try:
            result = self.client.table('reports').insert(report_data).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("No data returned from insert")

        except Exception as e:
            print(f"Error saving report: {e}")
            raise

    def get_reports(self, limit: int = 50, offset: int = 0) -> List[Dict]:
        """
        Get recent reports with pagination.

        Args:
            limit: Number of records to fetch
            offset: Number of records to skip

        Returns:
            List of reports
        """
        try:
            result = self.client.table('reports') \
                .select('*') \
                .order('timestamp', desc=True) \
                .range(offset, offset + limit - 1) \
                .execute()

            return result.data if result.data else []

        except Exception as e:
            print(f"Error fetching reports: {e}")
            return []

    def get_report_by_id(self, report_id: str) -> Optional[Dict]:
        """
        Get single report by ID.

        Args:
            report_id: Report UUID

        Returns:
            Report data or None
        """
        try:
            result = self.client.table('reports') \
                .select('*') \
                .eq('id', report_id) \
                .maybeSingle() \
                .execute()

            return result.data

        except Exception as e:
            print(f"Error fetching report: {e}")
            return None

    def get_daily_summary(self, date: Optional[datetime] = None) -> Dict:
        """
        Get daily summary of sleep vs cry time.

        Args:
            date: Date to summarize (defaults to today)

        Returns:
            Dict with sleep_minutes, cry_minutes, total_detections
        """
        try:
            if date is None:
                date = datetime.now()

            # Start and end of day
            start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = start_of_day + timedelta(days=1)

            # Query reports for the day
            result = self.client.table('reports') \
                .select('*') \
                .gte('timestamp', start_of_day.isoformat()) \
                .lt('timestamp', end_of_day.isoformat()) \
                .execute()

            reports = result.data if result.data else []

            # Calculate summary
            sleep_count = 0
            cry_count = 0
            sitting_count = 0
            no_baby_count = 0

            for report in reports:
                video_result = report.get('video_result', {})
                audio_result = report.get('audio_result', {})

                if not video_result.get('presence'):
                    no_baby_count += 1
                elif audio_result.get('status') == 'cry':
                    cry_count += 1
                elif video_result.get('activity') == 'sleeping':
                    sleep_count += 1
                elif video_result.get('activity') == 'sitting':
                    sitting_count += 1

            # Each detection represents 4 seconds
            sleep_minutes = (sleep_count * 4) / 60
            cry_minutes = (cry_count * 4) / 60
            active_minutes = (sitting_count * 4) / 60

            return {
                "date": date.strftime("%Y-%m-%d"),
                "sleep_minutes": round(sleep_minutes, 1),
                "cry_minutes": round(cry_minutes, 1),
                "active_minutes": round(active_minutes, 1),
                "total_detections": len(reports),
                "no_baby_detections": no_baby_count,
                "breakdown": {
                    "sleeping": sleep_count,
                    "crying": cry_count,
                    "sitting": sitting_count,
                    "no_baby": no_baby_count
                }
            }

        except Exception as e:
            print(f"Error generating daily summary: {e}")
            return {
                "date": date.strftime("%Y-%m-%d") if date else None,
                "error": str(e)
            }
