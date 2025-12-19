import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { CheckCircle2, XCircle, Clock, Zap, FileText, BarChart3, ArrowLeft, Filter, RotateCcw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import EvalRunner from './components/EvalRunner';
import StatsCard from './components/StatsCard';
import DatasetBuilder from './components/DatasetBuilder';
import { Dataset, PipefyProcess, EvalRun } from './types';

// Mock Data
const MOCK_DATASETS: Dataset[] = [
  {
    id: 'd1',
    name: 'IT Helpdesk Classification',
    process: PipefyProcess.IT_HELPDESK,
    description: 'Classify support tickets into urgent/non-urgent and categories.',
    cases: [
      { id: 'c1', input: 'My laptop screen is completely black and I have a client meeting in 10 mins!', expectedOutput: 'Urgency: High, Category: Hardware' },
      { id: 'c2', input: 'I need to install VS Code for the new intern.', expectedOutput: 'Urgency: Low, Category: Software Request' },
      { id: 'c3', input: 'The wifi on the 3rd floor is spotty.', expectedOutput: 'Urgency: Medium, Category: Network' },
      { id: 'c4', input: 'Password reset for Jira.', expectedOutput: 'Urgency: Medium, Category: Access' },
      { id: 'c5', input: 'My keyboard coffee spill.', expectedOutput: 'Urgency: High, Category: Hardware' }
    ]
  },
  {
    id: 'd2',
    name: 'Sales Lead Qualification',
    process: PipefyProcess.SALES_PIPELINE,
    description: 'Extract budget and timeline from email inquiries.',
    cases: [
      { id: 's1', input: 'Hi, we have a budget of $50k and need this by Q3.', expectedOutput: 'Budget: $50000, Timeline: Q3' },
      { id: 's2', input: 'Looking to explore options, no rush.', expectedOutput: 'Budget: Unknown, Timeline: Flexible' }
    ]
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [datasets, setDatasets] = useState<Dataset[]>(MOCK_DATASETS);
  const [evalHistory, setEvalHistory] = useState<EvalRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvalRun | null>(null);
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);

  // Filters State
  const [filterModel, setFilterModel] = useState<string>('all');
  const [filterDatasetId, setFilterDatasetId] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  const handleRunComplete = (run: EvalRun) => {
    setEvalHistory(prev => [run, ...prev]);
  };
  
  const handleSaveDataset = (newDataset: Dataset) => {
    setDatasets([newDataset, ...datasets]);
    setIsCreatingDataset(false);
  };

  const getLatestRun = () => evalHistory[0];

  const getFilteredHistory = () => {
    return evalHistory.filter(run => {
        const matchesModel = filterModel === 'all' || run.model === filterModel;
        const matchesDataset = filterDatasetId === 'all' || run.datasetId === filterDatasetId;
        
        let matchesDate = true;
        if (filterStartDate) {
            // Start of the selected day
            matchesDate = matchesDate && run.timestamp >= new Date(filterStartDate).getTime();
        }
        if (filterEndDate) {
            // End of the selected day
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && run.timestamp <= end.getTime();
        }

        return matchesModel && matchesDataset && matchesDate;
    });
  };

  const availableModels = Array.from(new Set(evalHistory.map(r => r.model)));

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-500">Overview of your AI Agent performance across Pipefy processes.</p>
                </div>
                <div className="text-sm text-gray-400">
                    Last updated: Just now
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard 
                title="Total Runs" 
                value={evalHistory.length} 
                icon={Zap} 
              />
              <StatsCard 
                title="Avg Accuracy" 
                value={evalHistory.length > 0 ? `${(getLatestRun()?.averageScore * 100).toFixed(1)}%` : '-'} 
                icon={CheckCircle2}
                trend="+2.4%"
                trendUp={true}
              />
              <StatsCard 
                title="Avg Latency" 
                value={evalHistory.length > 0 ? `${Math.round(getLatestRun()?.results.reduce((a,b) => a+b.latencyMs, 0) / getLatestRun()?.results.length)}ms` : '-'} 
                icon={Clock} 
                trend="-120ms"
                trendUp={true}
              />
              <StatsCard 
                title="Test Cases" 
                value={datasets.reduce((acc, d) => acc + d.cases.length, 0)} 
                icon={FileText} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">Accuracy Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evalHistory.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#94A3B8" fontSize={12} />
                            <YAxis domain={[0, 1]} stroke="#94A3B8" fontSize={12} />
                            <Tooltip />
                            <Line type="monotone" dataKey="averageScore" stroke="#0085FF" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">Pass vs Fail Rate</h3>
                    {evalHistory.length > 0 ? (
                        <div className="flex h-full items-center justify-center">
                           <div className="w-full max-w-xs space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">Pass ({Math.round(getLatestRun().passRate * 100)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${getLatestRun().passRate * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700">Fail ({Math.round((1 - getLatestRun().passRate) * 100)}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${(1 - getLatestRun().passRate) * 100}%` }}></div>
                                    </div>
                                </div>
                           </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
                    )}
                </div>
            </div>
          </div>
        );
      case 'evaluations':
        return (
          <div className="h-full flex flex-col">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Run Evaluation</h2>
                <p className="text-gray-500">Test your agent against ground truth datasets.</p>
            </div>
            <div className="flex-1 min-h-0">
                <EvalRunner datasets={datasets} onRunComplete={handleRunComplete} />
            </div>
          </div>
        );
      case 'datasets':
        if (isCreatingDataset) {
            return (
                <div className="h-full flex flex-col">
                    <DatasetBuilder 
                        onSave={handleSaveDataset} 
                        onCancel={() => setIsCreatingDataset(false)} 
                    />
                </div>
            );
        }

        return (
           <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Datasets</h2>
                        <p className="text-gray-500">Manage test cases for different Pipefy processes.</p>
                    </div>
                    <button 
                        onClick={() => setIsCreatingDataset(true)}
                        className="bg-[#0085FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0069CC] transition-colors shadow-sm"
                    >
                        + New Dataset
                    </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    {datasets.map((ds) => (
                        <div key={ds.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{ds.name}</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-[#0085FF] text-xs font-semibold rounded">{ds.process}</span>
                                </div>
                                <span className="text-sm text-gray-400">{ds.cases.length} cases</span>
                             </div>
                             <p className="text-gray-600 mb-4">{ds.description}</p>
                             <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Sample Data</h4>
                                <div className="space-y-2">
                                    {ds.cases.slice(0, 2).map((c, i) => (
                                        <div key={i} className="text-xs bg-gray-50 p-2 rounded">
                                            <span className="font-semibold text-gray-500">In:</span> {c.input.substring(0, 60)}...
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
           </div>
        );
      case 'results':
          if (selectedRun) {
            return (
                <div className="space-y-6">
                    <button 
                        onClick={() => setSelectedRun(null)}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to History</span>
                    </button>

                    <div className="flex justify-between items-end mb-6">
                         <div>
                            <h2 className="text-2xl font-bold text-gray-900">Run Analysis</h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="font-mono bg-gray-100 px-2 py-1 rounded">#{selectedRun.id.slice(0, 8)}</span>
                                <span>•</span>
                                <span>{selectedRun.model}</span>
                                <span>•</span>
                                <span>{new Date(selectedRun.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                             <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Average Score</p>
                                <p className="text-2xl font-bold text-[#0085FF]">{(selectedRun.averageScore * 100).toFixed(1)}%</p>
                             </div>
                             <div className="text-right border-l pl-4 border-gray-200">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Pass Rate</p>
                                <p className={`text-2xl font-bold ${selectedRun.passRate >= 0.8 ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {(selectedRun.passRate * 100).toFixed(0)}%
                                </p>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {selectedRun.results.map((result, idx) => (
                             <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header */}
                                <div className={`px-6 py-3 border-b border-gray-100 flex justify-between items-center ${result.isPass ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="font-mono text-xs text-gray-400 shrink-0">#{idx + 1}</span>
                                        <p className="font-medium text-gray-800 text-sm truncate">{result.input}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <span className="text-xs font-mono text-gray-500">{(result.score * 100).toFixed(0)}/100</span>
                                         {result.isPass ? (
                                            <span className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded text-xs">
                                                <CheckCircle2 size={12} /> PASS
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-xs">
                                                <XCircle size={12} /> FAIL
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Comparison Grid */}
                                <div className="grid grid-cols-2 divide-x divide-gray-100">
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Agent Output</h4>
                                            <span className="text-xs text-gray-400">{result.latencyMs}ms</span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 border border-gray-100 min-h-[100px] whitespace-pre-wrap">
                                            {result.actualOutput}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gray-50/30">
                                        <div className="mb-3">
                                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expected Output</h4>
                                        </div>
                                        <div className="bg-white rounded-lg p-4 text-sm text-gray-600 border border-gray-100 min-h-[100px] whitespace-pre-wrap">
                                            {result.expectedOutput}
                                        </div>
                                    </div>
                                </div>

                                {/* Reasoning Footer */}
                                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        <span className="font-bold text-gray-700">Judge Reasoning:</span> {result.reasoning}
                                    </p>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            );
          }
          
          const filteredHistory = getFilteredHistory();

          return (
            <div className="space-y-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Analysis History</h2>
                    <p className="text-gray-500">Detailed logs of past evaluation runs. Click on a row to view details.</p>
                </div>
                
                {/* Filter Controls */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-700">
                        <Filter size={16} /> Filter History
                    </div>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
                            <select 
                                value={filterModel}
                                onChange={(e) => setFilterModel(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#0085FF] outline-none min-w-[150px]"
                            >
                                <option value="all">All Models</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Dataset</label>
                            <select 
                                value={filterDatasetId}
                                onChange={(e) => setFilterDatasetId(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#0085FF] outline-none min-w-[200px]"
                            >
                                <option value="all">All Datasets</option>
                                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none"
                                />
                                <span className="text-gray-400">-</span>
                                <input 
                                    type="date" 
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none"
                                />
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setFilterModel('all');
                                setFilterDatasetId('all');
                                setFilterStartDate('');
                                setFilterEndDate('');
                            }}
                            className="px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>
                
                {filteredHistory.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-4">
                            <BarChart3 className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No Runs Found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your filters or run a new evaluation.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Run ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Model</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dataset</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Accuracy</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Pass Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredHistory.map((run) => (
                                    <tr 
                                        key={run.id} 
                                        onClick={() => setSelectedRun(run)}
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">#{run.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{run.model}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-[200px]">
                                            {datasets.find(d => d.id === run.datasetId)?.name || 'Unknown Dataset'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(run.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-gray-900">{(run.averageScore * 100).toFixed(1)}%</span>
                                                <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${run.averageScore * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                run.passRate >= 0.8 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {(run.passRate * 100).toFixed(0)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
          );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F7F9FC]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;