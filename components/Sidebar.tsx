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
    <div className="w-64 bg-[#0B2538] text-white flex flex-col h-screen fixed left-0 top-0 z-10 shadow-xl">
      <div className="p-6 border-b border-[#1E3A52]">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <div className="w-8 h-8 bg-[#90E0EF] rounded-lg flex items-center justify-center text-[#0B2538]">
             P
          </div>
          Pipefy Evals
        </h1>
        <p className="text-xs text-gray-400 mt-1">AI Assurance Platform</p>
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
                  ? 'bg-[#0085FF] text-white shadow-lg'
                  : 'text-gray-400 hover:bg-[#1E3A52] hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1E3A52]">
        <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors">
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
