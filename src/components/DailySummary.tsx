import { useState, useEffect } from 'react';
import { BarChart3, Moon, AlertTriangle, Activity } from 'lucide-react';
import { getDailySummary } from '../services/api';
import type { DailySummary as DailySummaryType } from '../types';

export default function DailySummary() {
  const [summary, setSummary] = useState<DailySummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDailySummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Summary</h2>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-4">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Daily Summary</h2>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  const totalMinutes = summary.sleep_minutes + summary.cry_minutes + summary.active_minutes;

  const getPercentage = (minutes: number) => {
    if (totalMinutes === 0) return 0;
    return Math.round((minutes / totalMinutes) * 100);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Daily Summary</h2>
        <span className="text-sm text-gray-500">{summary.date}</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Moon className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Sleeping</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{summary.sleep_minutes}</p>
          <p className="text-blue-600 text-sm">minutes</p>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="font-semibold text-red-900">Crying</h3>
          </div>
          <p className="text-3xl font-bold text-red-700">{summary.cry_minutes}</p>
          <p className="text-red-600 text-sm">minutes</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Active</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{summary.active_minutes}</p>
          <p className="text-green-600 text-sm">minutes</p>
        </div>
      </div>

      {/* Visual Bar Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Activity Distribution</h3>
        <div className="flex h-8 rounded-lg overflow-hidden">
          {summary.sleep_minutes > 0 && (
            <div
              className="bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(summary.sleep_minutes)}%` }}
              title={`Sleeping: ${summary.sleep_minutes} min`}
            >
              {getPercentage(summary.sleep_minutes) > 10 && `${getPercentage(summary.sleep_minutes)}%`}
            </div>
          )}
          {summary.cry_minutes > 0 && (
            <div
              className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(summary.cry_minutes)}%` }}
              title={`Crying: ${summary.cry_minutes} min`}
            >
              {getPercentage(summary.cry_minutes) > 10 && `${getPercentage(summary.cry_minutes)}%`}
            </div>
          )}
          {summary.active_minutes > 0 && (
            <div
              className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(summary.active_minutes)}%` }}
              title={`Active: ${summary.active_minutes} min`}
            >
              {getPercentage(summary.active_minutes) > 10 && `${getPercentage(summary.active_minutes)}%`}
            </div>
          )}
          {totalMinutes === 0 && (
            <div className="bg-gray-200 flex-1 flex items-center justify-center text-gray-500 text-xs">
              No data
            </div>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Detection Breakdown</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-gray-600">Total Detections</span>
            <span className="font-semibold text-gray-900">{summary.total_detections}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span className="text-gray-600">No Baby</span>
            <span className="font-semibold text-gray-900">{summary.no_baby_detections}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
            <span className="text-blue-700">Sleeping</span>
            <span className="font-semibold text-blue-900">{summary.breakdown.sleeping}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-red-50 rounded">
            <span className="text-red-700">Crying</span>
            <span className="font-semibold text-red-900">{summary.breakdown.crying}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
