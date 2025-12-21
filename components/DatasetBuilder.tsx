import React, { useState } from 'react';
import { Plus, Trash2, Save, X, FileText, Database, Info } from 'lucide-react';
import { Dataset, PipefyProcess, TestCase } from '../types';

interface DatasetBuilderProps {
  onSave: (dataset: Dataset) => void;
  onCancel: () => void;
}

const DatasetBuilder: React.FC<DatasetBuilderProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentContext, setAgentContext] = useState('');
  const [process, setProcess] = useState<PipefyProcess>(PipefyProcess.IT_HELPDESK);
  const [cases, setCases] = useState<Omit<TestCase, 'id'>[]>([
    { input: '', expectedOutput: '' }
  ]);

  const handleAddCase = () => {
    setCases([...cases, { input: '', expectedOutput: '' }]);
  };

  const handleRemoveCase = (index: number) => {
    setCases(cases.filter((_, i) => i !== index));
  };

  const handleCaseChange = (index: number, field: keyof Omit<TestCase, 'id'>, value: string) => {
    const newCases = [...cases];
    newCases[index] = { ...newCases[index], [field]: value };
    setCases(newCases);
  };

  const handleSave = () => {
    if (!name || !description || cases.some(c => !c.input || !c.expectedOutput)) {
      alert('Please fill in all fields including test cases.');
      return;
    }

    const newDataset: Dataset = {
      id: crypto.randomUUID(),
      name,
      description,
      agentContext,
      process,
      cases: cases.map(c => ({
        id: crypto.randomUUID(),
        ...c
      }))
    };

    onSave(newDataset);
  };

  return (
    <div className="bg-[#1e293b] rounded-xl shadow-lg border border-slate-800 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-slate-800 bg-[#0f172a] flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Create New Dataset</h2>
          <p className="text-sm text-slate-400">Define test cases for your Pipe automation.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-[#0085FF] hover:bg-[#0069CC] text-white px-4 py-2 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/30"
          >
            <Save size={18} />
            Save Dataset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Metadata Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Database size={16} /> Dataset Details
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Dataset Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., IT Service Desk - Email Triage"
                  className="w-full border border-slate-700 bg-[#020617] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none transition-all placeholder-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Process Taxonomy</label>
                <select 
                  value={process}
                  onChange={(e) => setProcess(e.target.value as PipefyProcess)}
                  className="w-full border border-slate-700 bg-[#020617] text-white rounded-lg p-3 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none"
                >
                  {Object.values(PipefyProcess).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the objective of this test set (e.g. Verify field extraction accuracy for invoices)..."
                  className="w-full border border-slate-700 bg-[#020617] text-white rounded-lg p-3 h-20 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none resize-none placeholder-slate-600"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-300 mb-2">Process Guidelines (Optional)</label>
                <textarea 
                  value={agentContext}
                  onChange={(e) => setAgentContext(e.target.value)}
                  placeholder="Specific rules for this pipe (e.g. 'If amount > $5000, set Approval Required field to YES')..."
                  className="w-full border border-slate-700 bg-[#020617] text-white rounded-lg p-3 h-20 focus:ring-2 focus:ring-[#0085FF] focus:border-[#0085FF] outline-none resize-none placeholder-slate-600"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-slate-800 my-8"></div>

          {/* Test Cases Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} /> Test Cases ({cases.length})
              </h3>
              <button 
                onClick={handleAddCase}
                className="text-sm text-[#0085FF] font-semibold hover:text-blue-400 flex items-center gap-1"
              >
                <Plus size={16} /> Add Case
              </button>
            </div>

            <div className="space-y-4">
              {cases.map((testCase, index) => (
                <div key={index} className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 relative group hover:border-slate-600 transition-colors">
                  <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleRemoveCase(index)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Remove Case"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <span className="absolute left-4 top-4 text-xs font-mono text-slate-600 font-bold">#{index + 1}</span>

                  <div className="grid grid-cols-2 gap-6 mt-6">
                    <div>
                      <div className="flex flex-col mb-2">
                        <label className="block text-xs font-semibold text-slate-300 uppercase">Input (Card Content)</label>
                        <span className="text-[10px] text-slate-500 italic mt-0.5">Example: "New invoice from Amazon for $150.40 due on Dec 1st."</span>
                      </div>
                      <textarea 
                        value={testCase.input}
                        onChange={(e) => handleCaseChange(index, 'input', e.target.value)}
                        placeholder="e.g. Email body, Description text..."
                        className="w-full border border-slate-700 bg-[#020617] text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none h-28 resize-none placeholder-slate-600"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col mb-2">
                        <label className="block text-xs font-semibold text-slate-300 uppercase">Expected Output (Field Updates)</label>
                        <span className="text-[10px] text-slate-500 italic mt-0.5">Example: "Field: Vendor = Amazon; Field: Amount = 150.40; Field: Due Date = 12/01"</span>
                      </div>
                      <textarea 
                        value={testCase.expectedOutput}
                        onChange={(e) => handleCaseChange(index, 'expectedOutput', e.target.value)}
                        placeholder="e.g. Field: Category = Hardware; Field: Urgency = High"
                        className="w-full border border-slate-700 bg-[#020617] text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#0085FF] outline-none h-28 resize-none placeholder-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
                onClick={handleAddCase}
                className="w-full py-3 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 font-medium hover:border-[#0085FF] hover:text-[#0085FF] transition-all flex items-center justify-center gap-2 mt-4 hover:bg-slate-800/50"
              >
                <Plus size={20} />
                Add Another Test Case
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DatasetBuilder;