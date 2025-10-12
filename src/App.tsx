import { useState } from 'react';
import { Baby, History, BarChart3 } from 'lucide-react';
import LiveMonitor from './components/LiveMonitor';
import ReportHistory from './components/ReportHistory';
import DailySummary from './components/DailySummary';

type TabType = 'monitor' | 'history' | 'summary';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('monitor');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 p-3 rounded-lg">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Baby Monitor AI</h1>
              <p className="text-gray-600">Real-time baby activity and cry detection</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('monitor')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'monitor'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Baby className="w-4 h-4" />
              Live Monitor
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="w-4 h-4" />
              Report History
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition border-b-2 ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Daily Summary
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'monitor' && <LiveMonitor />}
          {activeTab === 'history' && <ReportHistory />}
          {activeTab === 'summary' && <DailySummary />}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Baby Monitor AI - Powered by placeholder AI models</p>
          <p className="mt-1">Ready for production model integration</p>
        </div>
      </div>
    </div>
  );
}

export default App;
