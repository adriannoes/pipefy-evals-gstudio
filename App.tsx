import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  CheckCircle2, XCircle, Clock, Zap, FileText, BarChart3, 
  ArrowLeft, Filter, RotateCcw, Download, ExternalLink,
  ChevronRight, Search, Activity, Trash2
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import EvalRunner from './components/EvalRunner';
import StatsCard from './components/StatsCard';
import DatasetBuilder from './components/DatasetBuilder';
import { Dataset, PipefyProcess, EvalRun, EvalResult } from './types';

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
  const [caseSearchQuery, setCaseSearchQuery] = useState('');

  // Filters State for History
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

  const handleDeleteDataset = (id: string) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      setDatasets(prev => prev.filter(d => d.id !== id));
    }
  };

  const getLatestRun = () => evalHistory[0];

  const getFilteredHistory = () => {
    return evalHistory.filter(run => {
        const matchesModel = filterModel === 'all' || run.model === filterModel;
        const matchesDataset = filterDatasetId === 'all' || run.datasetId === filterDatasetId;
        
        let matchesDate = true;
        if (filterStartDate) {
            matchesDate = matchesDate && run.timestamp >= new Date(filterStartDate).getTime();
        }
        if (filterEndDate) {
            const end = new Date(filterEndDate);
            end.setHours(23, 59, 59, 999);
            matchesDate = matchesDate && run.timestamp <= end.getTime();
        }

        return matchesModel && matchesDataset && matchesDate;
    });
  };

  const availableModels = Array.from(new Set(evalHistory.map(r => r.model)));

  const handleDownloadJSON = (run: EvalRun) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(run, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `eval_run_${run.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Process AI Performance</h2>
                    <p className="text-slate-400">Overview of AI automation health across Pipefy Taxonomies.</p>
                </div>
                <div className="text-sm text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full border border-slate-700">
                    System Status: <span className="text-green-400 font-medium">Optimal</span>
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
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" />
                        Accuracy Trend
                    </h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evalHistory.slice().reverse()}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                            <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleTimeString()} stroke="#94A3B8" fontSize={10} />
                            <YAxis domain={[0, 1]} stroke="#94A3B8" fontSize={10} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                            />
                            <Line type="monotone" dataKey="averageScore" stroke="#0085FF" strokeWidth={3} dot={{r: 4, fill: '#0085FF', strokeWidth: 2, stroke: '#0f172a'}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-800">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-green-400" />
                        Pass vs Fail Rate
                    </h3>
                    {evalHistory.length > 0 ? (
                        <div className="flex h-full items-center justify-center">
                           <div className="w-full max-w-xs space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-300">Success Rate</span>
                                        <span className="text-green-400 font-bold">{Math.round(getLatestRun().passRate * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-3">
                                        <div className="bg-green-500 h-3 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-1000" style={{ width: `${getLatestRun().passRate * 100}%` }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="font-medium text-slate-300">Failure Rate</span>
                                        <span className="text-red-400 font-bold">{Math.round((1 - getLatestRun().passRate) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-3">
                                        <div className="bg-red-500 h-3 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-1000" style={{ width: `${(1 - getLatestRun().passRate) * 100}%` }}></div>
                                    </div>
                                </div>
                           </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 italic">Run your first evaluation to see insights.</div>
                    )}
                </div>
            </div>
          </div>
        );
      case 'evaluations':
        return (
          <div className="h-full flex flex-col animate-in slide-in-from-right duration-300">
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
                <div className="h-full flex flex-col animate-in zoom-in-95 duration-200">
                    <DatasetBuilder 
                        onSave={handleSaveDataset} 
                        onCancel={() => setIsCreatingDataset(false)} 
                    />
                </div>
            );
        }

        return (
           <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Datasets</h2>
                        <p className="text-slate-400">Manage test cases for Pipefy Process Taxonomies.</p>
                    </div>
                    <button 
                        onClick={() => setIsCreatingDataset(true)}
                        className="bg-[#0085FF] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#0069CC] transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2 active:scale-95"
                    >
                        + New Dataset
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {datasets.map((ds) => (
                        <div key={ds.id} className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-800 hover:border-[#0085FF]/50 transition-all group">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-[#0085FF] transition-colors">{ds.name}</h3>
                                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded border border-blue-900/50">{ds.process}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">{ds.cases.length} cases</span>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteDataset(ds.id);
                                        }}
                                        className="text-slate-500 hover:text-red-400 transition-colors p-1.5 hover:bg-red-900/20 rounded-md"
                                        title="Delete Dataset"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                             </div>
                             <p className="text-slate-400 text-sm mb-4 line-clamp-2">{ds.description}</p>
                             {ds.agentContext && (
                                <div className="mb-4 bg-blue-900/10 p-3 rounded-lg border border-blue-900/30">
                                    <h5 className="text-[10px] font-bold text-blue-400 uppercase mb-1 flex items-center gap-1">
                                        <FileText size={10} /> Process Guidelines
                                    </h5>
                                    <p className="text-xs text-blue-300/80 italic line-clamp-2">"{ds.agentContext}"</p>
                                </div>
                             )}
                             <div className="border-t border-slate-800 pt-4 mt-auto">
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>Last used: 2 days ago</span>
                                    <button className="text-[#0085FF] font-semibold hover:underline flex items-center gap-1">
                                        Edit <ChevronRight size={14} />
                                    </button>
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
           </div>
        );
      case 'results':
          if (selectedRun) {
            const filteredResults = selectedRun.results.filter(r => 
                r.input.toLowerCase().includes(caseSearchQuery.toLowerCase()) ||
                r.actualOutput.toLowerCase().includes(caseSearchQuery.toLowerCase())
            );

            return (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setSelectedRun(null)}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700"
                        >
                            <ArrowLeft size={18} />
                            <span className="font-medium text-sm">Back to History</span>
                        </button>
                        <div className="flex gap-2">
                             <button 
                                onClick={() => handleDownloadJSON(selectedRun)}
                                className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 text-sm"
                            >
                                <Download size={16} /> Export
                            </button>
                             <button className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-900/30 text-sm">
                                <ExternalLink size={16} /> Share
                            </button>
                        </div>
                    </div>

                    {/* Run Header / Summary */}
                    <div className="bg-[#1e293b] p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <BarChart3 size={120} />
                        </div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-3xl font-bold text-white">Evaluation Report</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                        selectedRun.passRate >= 0.8 ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-red-900/20 text-red-400 border-red-900/50'
                                    }`}>
                                        {selectedRun.passRate >= 0.8 ? 'HEALTHY' : 'NEEDS ATTENTION'}
                                    </span>
                                </div>
                                <p className="text-slate-400 max-w-lg">
                                    Performance analysis for <span className="text-white font-medium">{datasets.find(d => d.id === selectedRun.datasetId)?.name}</span>.
                                    Conducted on {new Date(selectedRun.timestamp).toLocaleDateString()} at {new Date(selectedRun.timestamp).toLocaleTimeString()}.
                                </p>
                                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                    <span>Run ID: {selectedRun.id.slice(0, 8)}</span>
                                    <span>•</span>
                                    <span>Model: {selectedRun.model}</span>
                                </div>
                            </div>
                            
                            <div className="flex gap-8 bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-inner">
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Mean Score</p>
                                    <p className="text-3xl font-black text-[#0085FF]">{(selectedRun.averageScore * 100).toFixed(1)}%</p>
                                </div>
                                <div className="w-px bg-slate-800"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Cases Passed</p>
                                    <p className={`text-3xl font-black ${selectedRun.passRate >= 0.8 ? 'text-green-400' : 'text-yellow-400'}`}>
                                        {Math.round(selectedRun.passRate * selectedRun.results.length)}/{selectedRun.results.length}
                                    </p>
                                </div>
                                <div className="w-px bg-slate-800"></div>
                                <div className="text-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Avg Latency</p>
                                    <p className="text-3xl font-black text-slate-300">
                                        {Math.round(selectedRun.results.reduce((a, b) => a + b.latencyMs, 0) / selectedRun.results.length)}ms
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cases List with Search */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <FileText size={20} className="text-slate-500" />
                                Test Case Breakdown
                            </h3>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Filter by input/output..." 
                                    value={caseSearchQuery}
                                    onChange={(e) => setCaseSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2 text-sm bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0085FF] outline-none text-white w-64 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {filteredResults.length > 0 ? filteredResults.map((result, idx) => (
                                <div key={idx} className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all">
                                    {/* Sub-Header */}
                                    <div className={`px-6 py-4 flex justify-between items-center transition-colors ${result.isPass ? 'bg-green-900/5' : 'bg-red-900/5'}`}>
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <span className="font-mono text-xs text-slate-600 font-bold px-2 py-1 bg-slate-900 rounded shrink-0">CASE #{idx + 1}</span>
                                            <p className="font-semibold text-slate-300 text-sm truncate max-w-xl italic">"{result.input}"</p>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${result.isPass ? 'text-green-400' : 'text-red-400'}`}>
                                                        {result.isPass ? 'Success' : 'Failed'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">{(result.score * 100).toFixed(0)}%</span>
                                                </div>
                                                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Latency: {result.latencyMs}ms</p>
                                            </div>
                                            {result.isPass ? <CheckCircle2 size={24} className="text-green-500 opacity-80" /> : <XCircle size={24} className="text-red-500 opacity-80" />}
                                        </div>
                                    </div>
                                    
                                    {/* Main Content */}
                                    <div className="grid grid-cols-2 divide-x divide-slate-800 border-t border-slate-800">
                                        <div className="p-6 space-y-3">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <Activity size={12} /> AI Agent Response
                                            </h4>
                                            <div className="bg-[#0f172a] rounded-xl p-4 text-sm text-slate-200 border border-slate-800 min-h-[120px] shadow-inner font-mono leading-relaxed">
                                                {result.actualOutput}
                                            </div>
                                        </div>
                                        <div className="p-6 space-y-3 bg-[#0f172a]/20">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                                <FileText size={12} /> Ground Truth (Target)
                                            </h4>
                                            <div className="bg-[#020617] rounded-xl p-4 text-sm text-slate-400 border border-slate-800 min-h-[120px] shadow-inner leading-relaxed">
                                                {result.expectedOutput}
                                            </div>
                                        </div>
                                    </div>

                                    {/* LLM Judge Reasoning */}
                                    <div className="px-6 py-4 bg-[#0f172a] border-t border-slate-800">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 shrink-0 bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20">
                                                <RotateCcw size={14} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Judge Reasoning</p>
                                                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                    {result.reasoning}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12 bg-[#1e293b] rounded-xl border border-dashed border-slate-700">
                                    <Search className="mx-auto text-slate-600 mb-2" size={32} />
                                    <p className="text-slate-400">No matching cases for "{caseSearchQuery}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
          }
          
          const filteredHistory = getFilteredHistory();

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="mb-6 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Analysis History</h2>
                        <p className="text-slate-400">Review past benchmark results and detailed LLM reasoning logs.</p>
                    </div>
                    <div className="text-xs font-mono text-slate-500">
                        {filteredHistory.length} Runs total
                    </div>
                </div>
                
                {/* Filter Controls */}
                <div className="bg-[#1e293b] p-5 rounded-xl shadow-lg border border-slate-800 mb-6">
                    <div className="flex flex-wrap gap-6 items-end">
                        <div className="flex-1 min-w-[140px]">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Model</label>
                            <select 
                                value={filterModel}
                                onChange={(e) => setFilterModel(e.target.value)}
                                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#020617] text-white focus:ring-2 focus:ring-[#0085FF] outline-none transition-all"
                            >
                                <option value="all">All Models</option>
                                {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dataset</label>
                            <select 
                                value={filterDatasetId}
                                onChange={(e) => setFilterDatasetId(e.target.value)}
                                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-[#020617] text-white focus:ring-2 focus:ring-[#0085FF] outline-none transition-all"
                            >
                                <option value="all">All Datasets</option>
                                {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="date" 
                                    value={filterStartDate}
                                    onChange={(e) => setFilterStartDate(e.target.value)}
                                    className="border border-slate-700 bg-[#020617] text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none [color-scheme:dark]"
                                />
                                <span className="text-slate-700 font-bold">-</span>
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
                            className="h-[38px] px-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all flex items-center gap-2 text-sm border border-slate-700 active:scale-95"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>
                </div>
                
                {filteredHistory.length === 0 ? (
                    <div className="bg-[#1e293b] rounded-xl p-20 text-center border border-slate-800 shadow-inner">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800 rounded-3xl mb-6 shadow-xl rotate-3">
                            <BarChart3 className="text-slate-600" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                        <p className="text-slate-500 max-w-sm mx-auto">We couldn't find any evaluation runs matching your current filters. Adjust the criteria or run a new evaluation.</p>
                        <button 
                            onClick={() => setActiveTab('evaluations')}
                            className="mt-6 text-[#0085FF] font-bold hover:underline"
                        >
                            Run New Eval Now →
                        </button>
                    </div>
                ) : (
                    <div className="bg-[#1e293b] rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#0f172a] border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipefy Workflow</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Model Agent</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Accuracy</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {filteredHistory.map((run) => (
                                        <tr 
                                            key={run.id} 
                                            onClick={() => setSelectedRun(run)}
                                            className="hover:bg-slate-800/40 transition-all cursor-pointer group active:bg-slate-800/60"
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-slate-500 group-hover:text-[#0085FF]">#{run.id.slice(0, 8)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-white mb-0.5">{datasets.find(d => d.id === run.datasetId)?.name || 'Deleted Dataset'}</p>
                                                <p className="text-[10px] text-slate-500 font-mono italic">Pipefy Internal Process</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs bg-slate-900 px-2 py-1 rounded text-slate-400 border border-slate-800">{run.model}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-400">
                                                <div>{new Date(run.timestamp).toLocaleDateString()}</div>
                                                <div className="text-[10px] font-mono">{new Date(run.timestamp).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-sm font-black ${run.averageScore >= 0.8 ? 'text-[#0085FF]' : 'text-slate-300'}`}>
                                                        {(run.averageScore * 100).toFixed(1)}%
                                                    </span>
                                                    <div className="w-20 bg-slate-800 rounded-full h-1.5 hidden sm:block">
                                                        <div className="bg-[#0085FF] h-1.5 rounded-full shadow-[0_0_5px_#3b82f6]" style={{ width: `${run.averageScore * 100}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border ${
                                                    run.passRate >= 0.8 ? 'bg-green-900/20 text-green-400 border-green-900/50' : 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50'
                                                }`}>
                                                    {run.passRate >= 0.8 ? 'OPTIMAL' : 'VARIANCY'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <ChevronRight size={18} className="text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all inline-block" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
          );
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen scroll-smooth">
        <div className="max-w-7xl mx-auto h-full pb-10">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;