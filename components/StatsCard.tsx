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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg text-[#0085FF]">
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className={`mt-4 text-sm font-medium flex items-center ${trendUp ? 'text-green-600' : 'text-red-500'}`}>
          <span>{trend}</span>
          <span className="ml-1 text-gray-400 font-normal">vs last run</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
