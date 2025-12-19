import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, Loader2, ArrowRight, Search, ChevronDown } from 'lucide-react';
import { AgentConfig, Dataset, EvalResult, EvalRun, EvalStatus } from '../types';
import { runAgentTask, evaluateResponse } from '../services/geminiService';

interface EvalRunnerProps {
  datasets: Dataset[];
  onRunComplete: (run: EvalRun) => void;
}

const AGENT_PRESETS = [
  {
    id: 'custom',
    label: 'Custom Agent',
    prompt: ''
  },
  {
    id: 'it_helpdesk',
    label: 'IT Helpdesk Agent',
    prompt: 'You are an intelligent IT Helpdesk agent for Pipefy. Your task is to analyze support tickets, categorize them into specific domains (Hardware, Software, Network, Access), and determine the urgency level based on the user\'s tone and impact.'
  },
  {
    id: 'purchase_process',
    label: 'Purchase Process Agent',
    prompt: 'You are a Procurement assistant in Pipefy. Analyze purchase requests to extract the vendor name, total amount, and list of items. Flag any high-value requests (over $1000) for manager approval.'
  },
  {
    id: 'recruitment',
    label: 'Recruitment Agent',
    prompt: 'You are an HR Recruitment AI agent. Parse candidate applications to extract the applicant\'s name, desired position, years of experience, and top 3 skills. Summarize their fit for a senior role.'
  },
  {
    id: 'sales',
    label: 'Sales Pipeline Agent',
    prompt: 'You are a Sales Development Representative agent. Qualify incoming leads by extracting budget, timeline, and company size. Classify the lead as Hot, Warm, or Cold based on purchasing intent.'
  }
];

const EvalRunner: React.FC<EvalRunnerProps> = ({ datasets, onRunComplete }) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || '');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('custom');
  // Default prompt if custom or initial load
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful Pipefy agent. Categorize the request and extract key entities.');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [status, setStatus] = useState<EvalStatus>(EvalStatus.IDLE);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [results, setResults] = useState<EvalResult[]>([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  
  // Dropdown State
  const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  const filteredPresets = AGENT_PRESETS.filter(p => 
    p.label.toLowerCase().includes(agentSearchQuery.toLowerCase())
  );

  const handleAgentSelect = (presetId: string) => {
    setSelectedAgentId(presetId);
    const preset = AGENT_PRESETS.find(p => p.id === presetId);
    if (preset && preset.id !== 'custom') {
      setSystemPrompt(preset.prompt);
    }
    setIsAgentDropdownOpen(false);
    setAgentSearchQuery('');
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[800px] overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div>
           <h2 className="text-lg font-bold text-gray-900">Configure Evaluation</h2>
           <p className="text-sm text-gray-500">Define your agent settings and select a ground-truth dataset.</p>
        </div>
        {status === EvalStatus.RUNNING && (
             <div className="flex items-center gap-2 text-[#0085FF] bg-blue-50 px-3 py-1 rounded-full text-sm font-medium">
                <Loader2 className="animate-spin" size={16} />
                Processing Case {currentCaseIndex + 1}/{selectedDataset?.cases.length}
             </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Configuration */}
        <div className="w-1/3 p-6 border-r border-gray-100 overflow-y-auto">
          <div className="space-y-6">
             <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Agent Persona</label>
              
              {/* Overlay to handle click outside */}
              {isAgentDropdownOpen && (
                <div className="fixed inset-0 z-10" onClick={() => setIsAgentDropdownOpen(false)}></div>
              )}

              {/* Custom Searchable Select Trigger */}
              <button
                onClick={() => {
                    if (status !== EvalStatus.RUNNING) {
                        setIsAgentDropdownOpen(!isAgentDropdownOpen);
                    }
                }}
                disabled={status === EvalStatus.RUNNING}
                className="relative w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none flex justify-between items-center text-left disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <span className={selectedAgentId ? "text-gray-900" : "text-gray-500"}>
                    {AGENT_PRESETS.find(p => p.id === selectedAgentId)?.label || "Select Agent..."}
                </span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>

              {/* Dropdown Menu */}
              {isAgentDropdownOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search agents..."
                                value={agentSearchQuery}
                                onChange={(e) => setAgentSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-[#0085FF] placeholder-gray-400"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        {filteredPresets.map(preset => (
                            <div
                                key={preset.id}
                                onClick={() => handleAgentSelect(preset.id)}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors border-l-2 ${
                                    selectedAgentId === preset.id 
                                    ? 'bg-blue-50/50 text-[#0085FF] font-medium border-[#0085FF]' 
                                    : 'text-gray-700 border-transparent'
                                }`}
                            >
                                {preset.label}
                            </div>
                        ))}
                        {filteredPresets.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-400 text-center">No agents found</div>
                        )}
                    </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">System Instructions</label>
              <textarea 
                value={systemPrompt}
                onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setSelectedAgentId('custom'); // Switch to custom if user edits manually
                }}
                disabled={status === EvalStatus.RUNNING}
                className="w-full h-32 border border-gray-300 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none resize-none font-mono"
                placeholder="Define how the agent should behave..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Dataset</label>
              <select 
                value={selectedDatasetId}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                disabled={status === EvalStatus.RUNNING}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none transition-all"
              >
                {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.cases.length} cases)</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
              <select 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={status === EvalStatus.RUNNING}
                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none"
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
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-[#0085FF] hover:bg-[#0069CC] text-white shadow-md hover:shadow-lg'
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
        <div className="flex-1 bg-white flex flex-col">
            {/* Progress Bar */}
            {status !== EvalStatus.IDLE && (
                <div className="w-full bg-gray-100 h-1.5">
                    <div 
                        className="bg-[#0085FF] h-1.5 transition-all duration-300 ease-out" 
                        style={{ width: `${currentProgress}%` }}
                    />
                </div>
            )}

            <div className="flex-1 p-6 overflow-y-auto">
                {results.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Play size={32} className="text-gray-300 ml-1" />
                        </div>
                        <p className="font-medium">Ready to run</p>
                        <p className="text-sm">Select an agent persona and dataset to start.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {results.map((result, idx) => (
                            <div key={idx} className={`border rounded-lg p-4 text-sm ${
                                result.isPass ? 'border-green-100 bg-green-50/30' : 'border-red-100 bg-red-50/30'
                            }`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-gray-500 text-xs">Case #{idx + 1}</span>
                                        {result.isPass ? (
                                            <span className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded text-xs">
                                                <CheckCircle size={12} /> PASS
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-red-700 font-bold bg-red-100 px-2 py-0.5 rounded text-xs">
                                                <AlertCircle size={12} /> FAIL
                                            </span>
                                        )}
                                        <span className="text-xs text-gray-400">Score: {result.score.toFixed(2)}</span>
                                        <span className="text-xs text-gray-400">Latency: {result.latencyMs}ms</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Agent Output</p>
                                        <p className="text-gray-900 bg-white p-2 rounded border border-gray-100">{result.actualOutput}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Ground Truth</p>
                                        <p className="text-gray-600 bg-white p-2 rounded border border-gray-100">{result.expectedOutput}</p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-100/50">
                                     <p className="text-xs text-gray-500"><span className="font-semibold">Judge's Reasoning:</span> {result.reasoning}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {status === EvalStatus.COMPLETED && (
                <div className="p-4 border-t border-gray-100 bg-green-50 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-green-900">Evaluation Complete</p>
                        <p className="text-sm text-green-700">Check the Analysis tab for detailed metrics.</p>
                    </div>
                    <button className="text-green-800 font-semibold text-sm flex items-center gap-1 hover:underline">
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