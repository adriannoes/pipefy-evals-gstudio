import React from 'react';
import { LayoutDashboard, Database, PlayCircle, BarChart3, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'datasets', label: 'Datasets', icon: Database },
    { id: 'evaluations', label: 'Run Evals', icon: PlayCircle },
    { id: 'results', label: 'Analysis', icon: BarChart3 },
  ];

  return (
    <div className="w-64 bg-[#0f172a] text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-10 shadow-xl border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-[#0085FF] rounded-lg flex items-center justify-center text-white">
             P
          </div>
          Pipefy Evals
        </h1>
        <p className="text-xs text-slate-500 mt-1">AI Assurance Platform</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[#0085FF] text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-lg">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;