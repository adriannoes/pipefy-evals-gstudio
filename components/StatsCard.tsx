import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp }) => {
  return (
    <div className="bg-[#1e293b] p-6 rounded-xl shadow-lg border border-slate-800 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-2 bg-blue-500/10 rounded-lg text-[#0085FF]">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className={`mt-4 text-sm font-medium flex items-center ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
          <span>{trend}</span>
          <span className="ml-1 text-slate-500 font-normal">vs last run</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;