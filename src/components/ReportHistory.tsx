import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Baby } from 'lucide-react';
import { getReports } from '../services/api';
import type { Report } from '../types';

export default function ReportHistory() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports(50, 0);
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Report History</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-4">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Report History</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (report: Report) => {
    if (!report.video_result.presence) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">No Baby</span>;
    }

    if (report.audio_result.status === 'cry') {
      return <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Crying</span>;
    }

    if (report.video_result.activity === 'sleeping') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">Sleeping</span>;
    }

    return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Awake</span>;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Report History</h2>
        <button
          onClick={loadReports}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-12">
          <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No reports yet</p>
          <p className="text-gray-400 text-sm mt-1">Start monitoring to generate reports</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {reports.map((report) => (
            <div
              key={report.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(report)}
                    {report.notified && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        SMS Sent
                      </span>
                    )}
                  </div>

                  {report.combined_message && (
                    <p className="text-gray-800 font-medium mb-2">{report.combined_message}</p>
                  )}

                  {!report.video_result.presence && (
                    <p className="text-gray-600 text-sm">No baby detected in frame</p>
                  )}

                  {report.video_result.presence && !report.combined_message && (
                    <p className="text-gray-600 text-sm">
                      Baby {report.video_result.activity || 'present'}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    {report.audio_result.confidence > 0 && (
                      <span>Audio: {Math.round(report.audio_result.confidence * 100)}%</span>
                    )}
                    {report.video_result.confidence > 0 && (
                      <span>Video: {Math.round(report.video_result.confidence * 100)}%</span>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(report.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-xs mt-1">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
