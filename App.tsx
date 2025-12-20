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

// Mock Data - Updated for Pipefy Taxonomies
const MOCK_DATASETS: Dataset[] = [
  {
    id: 'd1',
    name: 'IT Service Desk - Ticket Classification',
    process: PipefyProcess.IT_HELPDESK,
    description: 'Test set for "Input Phase" in IT Service Desk. Verifies if the AI correctly assigns categories and urgency based on description.',
    agentContext: 'Strict rules: "Server Down" is always Critical. "Reset Password" is Low priority/Access category.',
    cases: [
      { id: 'c1', input: 'My laptop screen is completely black and I have a client meeting in 10 mins!', expectedOutput: 'Field: Urgency = Critical; Field: Category = Hardware' },
      { id: 'c2', input: 'I need to install VS Code for the new intern.', expectedOutput: 'Field: Urgency = Low; Field: Category = Software Request' },
      { id: 'c3', input: 'The wifi on the 3rd floor is spotty.', expectedOutput: 'Field: Urgency = Medium; Field: Category = Network' },
      { id: 'c4', input: 'Password reset for Jira.', expectedOutput: 'Field: Urgency = Low; Field: Category = Access' },
      { id: 'c5', input: 'My keyboard coffee spill.', expectedOutput: 'Field: Urgency = High; Field: Category = Hardware' }
    ]
  },
  {
    id: 'd2',
    name: 'Sales Pipeline - Lead Qualification',
    process: PipefyProcess.SALES_PIPELINE,
    description: 'Test set for "Qualification Phase". Verifies extraction of budget and timeline from initial email inquiries.',
    cases: [
      { id: 's1', input: 'Hi, we have a budget of $50k and need this by Q3.', expectedOutput: 'Field: Budget = $50,000; Field: Timeline = Q3; Field: Lead Score = High' },
      { id: 's2', input: 'Looking to explore options, no rush.', expectedOutput: 'Field: Budget = Unknown; Field: Timeline = Flexible; Field: Lead Score = Low' }
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
                    <h2 className="text-2xl font-bold text-white">Process AI Performance</h2>
                    <p className="text-slate-400">Overview of AI automation health across Pipefy Taxonomies (IT, HR, Finance, etc).</p>
                </div>
                <div className="text-sm text-slate-500">
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
                <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-800">
                    <h3 className="font-semibold text-white mb-4">Accuracy Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evalHistory.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#94A3B8" fontSize={12} />
                            <YAxis domain={[0, 1]} stroke="#94A3B8" fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Line type="monotone" dataKey="averageScore" stroke="#0085FF" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-800">
                    <h3 className="font-semibold text-white mb-4">Pass vs Fail Rate</h3>
                    {evalHistory.length > 0 ? (
                        <div className="flex h-full items-center justify-center">
                           <div className="w-full max-w-xs space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-300">Pass ({Math.round(getLatestRun().passRate * 100)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                                        <div className="bg-green-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${getLatestRun().passRate * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-300">Fail ({Math.round((1 - getLatestRun().passRate) * 100)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                                        <div className="bg-red-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]" style={{ width: `${(1 - getLatestRun().passRate) * 100}%` }}></div>
                                    </div>
                                </div>
                           </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500">No data available</div>
                    )}
                </div>
            </div>
          </div>
        );
      case 'evaluations':
        return (
          <div className="h-full flex flex-col">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Run Evaluation</h2>
                <p className="text-slate-400">Measure AI performance against Ground Truth datasets for specific Pipes.</p>
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
                        <h2 className="text-2xl font-bold text-white">Datasets</h2>
                        <p className="text-slate-400">Manage test cases for Pipefy Process Taxonomies.</p>
                    </div>
                    <button 
                        onClick={() => setIsCreatingDataset(true)}
                        className="bg-[#0085FF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0069CC] transition-colors shadow-lg shadow-blue-900/30"
                    >
                        + New Dataset
                    </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                    {datasets.map((ds) => (
                        <div key={ds.id} className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-800 hover:border-slate-600 transition-colors">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{ds.name}</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-900/30 text-blue-400 text-xs font-semibold rounded border border-blue-900/50">{ds.process}</span>
                                </div>
                                <span className="text-sm text-slate-500">{ds.cases.length} cases</span>
                             </div>
                             <p className="text-slate-400 mb-4">{ds.description}</p>
                             {ds.agentContext && (
                                <div className="mb-4 bg-blue-900/10 p-3 rounded-lg border border-blue-900/30">
                                    <h5 className="text-xs font-bold text-blue-400 uppercase mb-1">Process Guidelines / Context</h5>
                                    <p className="text-sm text-blue-300/80">{ds.agentContext}</p>
                                </div>
                             )}
                             <div className="border-t border-slate-800 pt-4">
                                <h4 className="text-sm font-semibold text-slate-300 mb-2">Sample Data</h4>
                                <div className="space-y-2">
                                    {ds.cases.slice(0, 2).map((c, i) => (
                                        <div key={i} className="text-xs bg-[#0f172a] p-2 rounded border border-slate-800 text-slate-400">
                                            <span className="font-semibold text-slate-300">In:</span> {c.input.substring(0, 60)}...
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
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to History</span>
                    </button>

                    <div className="flex justify-between items-end mb-6">
                         <div>
                            <h2 className="text-2xl font-bold text-white">Run Analysis</h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                                <span className="font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700">#{selectedRun.id.slice(0, 8)}</span>
                                <span>•</span>
                                <span>{selectedRun.model}</span>
                                <span>•</span>
                                <span>{new Date(selectedRun.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                             <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Average Score</p>
                                <p className="text-2xl font-bold text-[#0085FF]">{(selectedRun.averageScore * 100).toFixed(1)}%</p>
                             </div>
                             <div className="text-right border-l pl-4 border-slate-800">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Pass Rate</p>
                                <p className={`text-2xl font-bold ${selectedRun.passRate >= 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {(selectedRun.passRate * 100).toFixed(0)}%
                                </p>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {selectedRun.results.map((result, idx) => (
                             <div key={idx} className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                                {/* Header */}
                                <div className={`px-6 py-3 border-b border-slate-800 flex justify-between items-center ${result.isPass ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="font-mono text-xs text-slate-500 shrink-0">#{idx + 1}</span>
                                        <p className="font-medium text-slate-200 text-sm truncate">{result.input}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <span className="text-xs font-mono text-slate-400">{(result.score * 100).toFixed(0)}/100</span>
                                         {result.isPass ? (
                                            <span className="flex items-center gap-1 text-green-400 font-bold bg-green-900/20 px-2 py-0.5 rounded text-xs border border-green-900/30">
                                                <CheckCircle2 size={12} /> PASS
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-400 font-bold bg-red-900/20 px-2 py-0.5 rounded text-xs border border-red-900/30">
                                                <XCircle size={12} /> FAIL
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Comparison Grid */}
                                <div className="grid grid-cols-2 divide-x divide-slate-800">
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Process Output</h4>
                                            <span className="text-xs text-slate-500">{result.latencyMs}ms</span>
                                        </div>
                                        <div className="bg-[#0f172a] rounded-lg p-4 text-sm text-slate-300 border border-slate-800 min-h-[100px] whitespace-pre-wrap">
                                            {result.actualOutput}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-[#0f172a]/30">
                                        <div className="mb-3">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ground Truth</h4>
                                        </div>
                                        <div className="bg-[#020617] rounded-lg p-4 text-sm text-slate-400 border border-slate-800 min-h-[100px] whitespace-pre-wrap">
                                            {result.expectedOutput}
                                        </div>
                                    </div>
                                </div>

                                {/* Reasoning Footer */}
                                <div className="px-6 py-3 bg-[#0f172a] border-t border-slate-800">
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        <span className="font-bold text-slate-300">Judge Reasoning:</span> {result.reasoning}
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
                    <h2 className="text-2xl font-bold text-white">Analysis History</h2>
                    <p className="text-slate-400">Detailed logs of past evaluation runs. Click on a row to view details.</p>
                </div>
                
                {/* Filter Controls */}
                <div className="bg-[#1e293b] p-4 rounded-xl shadow-lg border border-slate-800 mb-6">
                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-300">
                        <Filter size={16} /> Filter History
                    </div>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
                            <select 
                                value={filterModel}
                                onChange={(e) => setFilterModel(e.target.value)}
                                className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#020617] text-white focus:ring-2 focus:ring-[#0085FF] outline-none min-w-[150px]"
                            >
                                <option value="all">All Models</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Dataset</label>
                            <select 
                                value={filterDatasetId}
                                onChange={(e) => setFilterDatasetId(e.target.value)}
                                className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#020617] text-white focus:ring-2 focus:ring-[#0085FF] outline-none min-w-[200px]"
                            >
                                <option value="all">All Datasets</option>
                                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Date Range</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="date" 
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="border border-slate-700 bg-[#020617] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none [color-scheme:dark]"
                                />
                                <span className="text-slate-600">-</span>
                                <input 
                                    type="date" 
                                    value={filterEndDate}
                                    onChange={(e) => setFilterEndDate(e.target.value)}
                                    className="border border-slate-700 bg-[#020617] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none [color-scheme:dark]"
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
                            className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>
                </div>
                
                {filteredHistory.length === 0 ? (
                    <div className="bg-[#1e293b] rounded-xl p-12 text-center border border-slate-800">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-800 rounded-full mb-4">
                            <BarChart3 className="text-slate-600" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white">No Runs Found</h3>
                        <p className="text-slate-500 mt-2">Try adjusting your filters or run a new evaluation.</p>
                    </div>
                ) : (
                    <div className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-800 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-[#0f172a] border-b border-slate-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Run ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Model</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Dataset</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Accuracy</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Pass Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredHistory.map((run) => (
                                    <tr 
                                        key={run.id} 
                                        onClick={() => setSelectedRun(run)}
                                        className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-4 text-sm font-mono text-slate-400">#{run.id.slice(0, 8)}</td>
                                        <td className="px-6 py-4 text-sm text-white">{run.model}</td>
                                        <td className="px-6 py-4 text-sm text-slate-400 truncate max-w-[200px]">
                                            {datasets.find(d => d.id === run.datasetId)?.name || 'Unknown Dataset'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-400">{new Date(run.timestamp).toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{(run.averageScore * 100).toFixed(1)}%</span>
                                                <div className="w-24 bg-slate-700 rounded-full h-1.5">
                                                    <div className="bg-blue-500 h-1.5 rounded-full shadow-[0_0_5px_#3b82f6]" style={{ width: `${run.averageScore * 100}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                run.passRate >= 0.8 ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
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
    <div className="flex min-h-screen bg-[#020617]">
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