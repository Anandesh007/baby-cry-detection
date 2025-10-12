import type { AnalysisResponse, Report, DailySummary } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export async function analyzeMedia(
  audioBlob: Blob,
  videoBlob: Blob,
  timestamp: Date = new Date()
): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.webm');
  formData.append('video', videoBlob, 'video.webm');
  formData.append('timestamp', timestamp.toISOString());

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Analysis failed');
  }

  return response.json();
}

export async function getReports(limit = 50, offset = 0): Promise<Report[]> {
  const response = await fetch(
    `${API_BASE_URL}/reports?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch reports');
  }

  const data = await response.json();
  return data.reports;
}

export async function getReport(id: string): Promise<Report> {
  const response = await fetch(`${API_BASE_URL}/reports/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch report');
  }

  return response.json();
}

export async function sendTestNotification(
  message = 'Test notification from Baby Monitor'
): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/notify-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    throw new Error('Failed to send test notification');
  }

  return response.json();
}

export async function getDailySummary(date?: Date): Promise<DailySummary> {
  const params = date ? `?date=${date.toISOString().split('T')[0]}` : '';
  const response = await fetch(`${API_BASE_URL}/summary/daily${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch daily summary');
  }

  return response.json();
}
