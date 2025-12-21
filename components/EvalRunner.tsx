import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, ArrowRight, Search, ChevronDown, Workflow } from 'lucide-react';
import { AgentConfig, Dataset, EvalResult, EvalRun, EvalStatus } from '../types';
import { runAgentTask, evaluateResponse } from '../services/geminiService';

interface EvalRunnerProps {
  datasets: Dataset[];
  onRunComplete: (run: EvalRun) => void;
}

const TAXONOMY_PRESETS = [
  {
    id: 'custom',
    label: 'Custom Process / Taxonomy',
    description: 'Define your own prompt manually for any specific Pipefy process.',
    prompt: ''
  },
  {
    id: 'it_service_desk',
    label: 'IT Service Desk (Triage Phase)',
    description: 'Analyzes ticket descriptions to categorize issues (Hardware, Software) and assign SLA priority.',
    prompt: 'You are an AI Automation running inside a Pipefy "IT Service Desk" pipe. When a new card is created via email, your goal is to analyze the description to update the "Category" field (Hardware, Software, Access, Network) and the "SLA Priority" field (Critical, High, Medium, Low). Output the result in a structured format suited for field updates.'
  },
  {
    id: 'accounts_payable',
    label: 'Finance - Accounts Payable (Invoice Extraction)',
    description: 'Extracts invoice details like Vendor Name, Amount, and Due Date from request text.',
    prompt: 'You are an AI assistant in the "Accounts Payable" pipe. A new invoice request has arrived in the "Input" phase. Analyze the request text to extract data for the following Pipefy fields: "Vendor Name", "Invoice Amount", "Due Date", and suggest a "Cost Center" based on the purchase description.'
  },
  {
    id: 'recruiting',
    label: 'HR - Recruiting (Candidate Screening)',
    description: 'Screens candidate applications to extract skills, experience, and calculate a fit score.',
    prompt: 'You are an AI Evaluator in the "Recruiting" pipe, specifically in the "Screening" phase. Analyze the candidate application text. Your task is to extract "Years of Experience", "Top 3 Skills", and provide a "Fit Score" (1-10) based on the requirement for a Senior Role.'
  },
  {
    id: 'sales_pipeline',
    label: 'Sales - Lead Qualification (CRM)',
    description: 'Qualifies sales leads by determining temperature, budget, and suggesting next actions.',
    prompt: 'You are an AI automation for the "Sales Pipeline". A new lead card has entered the "Qualification" phase. Analyze the interaction history. Update the "Lead Temperature" field (Hot, Warm, Cold), extract the "Estimated Budget", and suggest the Next Action for the Sales Rep.'
  }
];

const EvalRunner: React.FC<EvalRunnerProps> = ({ datasets, onRunComplete }) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || '');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('custom');
  // Default prompt if custom or initial load
  const [systemPrompt, setSystemPrompt] = useState('You are an AI automation within a Pipefy workflow. Analyze the input to update fields or move the card.');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [status, setStatus] = useState<EvalStatus>(EvalStatus.IDLE);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  
  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  const filteredPresets = TAXONOMY_PRESETS.filter(p => 
    p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = TAXONOMY_PRESETS.find(p => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setSystemPrompt(preset.prompt);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const handleStartEval = async () => {
    if (!selectedDataset) return;
    
    setStatus(EvalStatus.RUNNING);
    setResults([]);
    setCurrentProgress(0);
    setCurrentCaseIndex(0);

    const config: AgentConfig = {
      model,
      systemInstruction: systemPrompt,
      temperature: 0.2
    };

    const tempResults: EvalResult[] = [];

    // Process each test case sequentially
    for (let i = 0; i < selectedDataset.cases.length; i++) {
        setCurrentCaseIndex(i);
        const testCase = selectedDataset.cases[i];
        
        // 1. Run Agent
        const agentResponse = await runAgentTask(testCase.input, config);
        
        // 2. Run Evaluator (Judge)
        const evalResult = await evaluateResponse(testCase, agentResponse.text);
        
        const fullResult: EvalResult = {
            ...evalResult,
            latencyMs: agentResponse.latency
        };

        tempResults.push(fullResult);
        setResults([...tempResults]);
        setCurrentProgress(((i + 1) / selectedDataset.cases.length) * 100);
    }

    setStatus(EvalStatus.COMPLETED);
    
    // Calculate aggregate stats
    const totalScore = tempResults.reduce((acc, curr) => acc + curr.score, 0);
    const passCount = tempResults.filter(r => r.isPass).length;
    
    const runSummary: EvalRun = {
        id: crypto.randomUUID(),
        datasetId: selectedDataset.id,
        timestamp: Date.now(),
        model: model,
        averageScore: totalScore / tempResults.length,
        passRate: passCount / tempResults.length,
        results: tempResults,
        status: EvalStatus.COMPLETED
    };

    onRunComplete(runSummary);
  };

  return (
    <div className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-800 flex flex-col h-full max-h-[800px] overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
        <div>
           <h2 className="text-lg font-bold text-white">Configure Evaluation</h2>
           <p className="text-sm text-slate-400">Select a Pipefy Taxonomy to test your AI automation.</p>
        </div>
        {status === EvalStatus.RUNNING && (
             <div className="flex items-center gap-2 text-blue-400 bg-blue-900/20 px-3 py-1 rounded-full text-sm font-medium border border-blue-900/50">
                <Loader2 className="animate-spin" size={16} />
                Processing Case {currentCaseIndex + 1}/{selectedDataset?.cases.length}
             </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Configuration */}
        <div className="w-1/3 p-6 border-r border-slate-800 overflow-y-auto bg-[#1e293b]">
          <div className="space-y-6">
             <div className="relative">
              <label className="block text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <Workflow size={14} /> Pipefy Taxonomy
              </label>
              
              {/* Overlay to handle click outside */}
              {isDropdownOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
              )}

              {/* Custom Searchable Select Trigger */}
              <button
                onClick={() => {
                    if (status !== EvalStatus.RUNNING) {
                        setIsDropdownOpen(!isDropdownOpen);
                    }
                }}
                disabled={status === EvalStatus.RUNNING}
                className="relative w-full border border-slate-700 rounded-lg p-2.5 bg-[#020617] text-slate-200 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none flex justify-between items-center text-left disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors hover:border-slate-600"
              >
                <div className="flex flex-col overflow-hidden">
                    <span className={selectedPresetId ? "text-slate-200 truncate" : "text-slate-500"}>
                        {TAXONOMY_PRESETS.find(p => p.id === selectedPresetId)?.label || "Select Taxonomy..."}
                    </span>
                    {selectedPresetId && (
                         <span className="text-[10px] text-slate-500 truncate">
                            {TAXONOMY_PRESETS.find(p => p.id === selectedPresetId)?.description}
                         </span>
                    )}
                </div>
                <ChevronDown size={16} className="text-slate-500 shrink-0 ml-2" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-slate-700 bg-[#0f172a] sticky top-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or capability..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-700 bg-[#1e293b] text-white rounded-md focus:outline-none focus:border-[#0085FF] placeholder-slate-500"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                        {filteredPresets.map(preset => (
                            <div
                                key={preset.id}
                                onClick={() => handlePresetSelect(preset.id)}
                                className={`px-4 py-3 cursor-pointer hover:bg-slate-800 transition-colors border-l-2 ${
                                    selectedPresetId === preset.id 
                                    ? 'bg-blue-900/20 border-[#0085FF]' 
                                    : 'border-transparent'
                                }`}
                            >
                                <div className={`text-sm font-medium ${selectedPresetId === preset.id ? 'text-[#0085FF]' : 'text-slate-200'}`}>
                                    {preset.label}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {preset.description}
                                </div>
                            </div>
                        ))}
                        {filteredPresets.length === 0 && (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">No taxonomies found</div>
                        )}
                    </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Process Instructions</label>
              <textarea 
                value={systemPrompt}
                onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setSelectedPresetId('custom'); // Switch to custom if user edits manually
                }}
                disabled={status === EvalStatus.RUNNING}
                className="w-full h-32 border border-slate-700 rounded-lg p-3 text-sm bg-[#020617] text-slate-200 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none resize-none font-mono placeholder-slate-600 disabled:bg-slate-800 disabled:text-slate-500"
                placeholder="Define the prompt for the pipe automation..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Select Dataset</label>
              <select 
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                disabled={status === EvalStatus.RUNNING}
                className="w-full border border-slate-700 rounded-lg p-2.5 bg-[#020617] text-slate-200 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none transition-all disabled:bg-slate-800 disabled:text-slate-500"
              >
                {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.cases.length} cases)</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={status === EvalStatus.RUNNING}
                className="w-full border border-slate-700 rounded-lg p-2.5 bg-[#020617] text-slate-200 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none disabled:bg-slate-800 disabled:text-slate-500"
              >
                <option value="gemini-3-flash-preview">gemini-3-flash-preview (Fast)</option>
                <option value="gemini-3-pro-preview">gemini-3-pro-preview (Reasoning)</option>
                <option value="gemini-2.5-flash-latest">gemini-2.5-flash-latest</option>
              </select>
            </div>

            <button 
                onClick={handleStartEval}
                disabled={status === EvalStatus.RUNNING}
                className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                    status === EvalStatus.RUNNING 
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                    : 'bg-[#0085FF] hover:bg-[#0069CC] text-white shadow-lg shadow-blue-900/30'
                }`}
            >
                {status === EvalStatus.RUNNING ? 'Evaluation in Progress...' : (
                    <>
                        <Play size={20} fill="currentColor" />
                        Start Evaluation
                    </>
                )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Progress & Results */}
        <div className="flex-1 bg-[#1e293b] flex flex-col">
            {/* Progress Bar */}
            {status !== EvalStatus.IDLE && (
                <div className="w-full bg-slate-800 h-1.5">
                    <div 
                        className="bg-[#0085FF] h-1.5 transition-all duration-300 ease-out shadow-[0_0_10px_#0085FF]" 
                        style={{ width: `${currentProgress}%` }}
                    />
                </div>
            )}

            <div className="flex-1 p-6 overflow-y-auto">
                {results.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Workflow size={32} className="text-slate-600 ml-1" />
                        </div>
                        <p className="font-medium text-slate-400">Ready to run</p>
                        <p className="text-sm">Select a taxonomy and dataset to start.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {results.map((result, idx) => (
                            <div key={idx} className={`border rounded-lg p-4 text-sm ${
                                result.isPass ? 'border-green-900/50 bg-green-900/10' : 'border-red-900/50 bg-red-900/10'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-500 text-xs">Case #{idx + 1}</span>
                                        {result.isPass ? (
                                            <span className="flex items-center gap-1 text-green-400 font-bold bg-green-900/30 px-2 py-0.5 rounded text-xs border border-green-900/50">
                                                <CheckCircle size={12} /> PASS
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-400 font-bold bg-red-900/30 px-2 py-0.5 rounded text-xs border border-red-900/50">
                                                <AlertCircle size={12} /> FAIL
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-400">Score: {result.score.toFixed(2)}</span>
                                        <span className="text-xs text-slate-400">Latency: {result.latencyMs}ms</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Process Output</p>
                                        <p className="text-slate-200 bg-[#020617] p-2 rounded border border-slate-700">{result.actualOutput}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Ground Truth</p>
                                        <p className="text-slate-400 bg-[#020617] p-2 rounded border border-slate-700">{result.expectedOutput}</p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-700/50">
                                     <p className="text-xs text-slate-400"><span className="font-semibold text-slate-300">Judge's Reasoning:</span> {result.reasoning}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {status === EvalStatus.COMPLETED && (
                <div className="p-4 border-t border-slate-800 bg-green-900/10 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-green-400">Evaluation Complete</p>
                        <p className="text-sm text-green-300/70">Check the Analysis tab for detailed metrics.</p>
                    </div>
                    <button className="text-green-400 font-semibold text-sm flex items-center gap-1 hover:text-green-300 transition-colors">
                        View Analysis <ArrowRight size={16} />
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EvalRunner;