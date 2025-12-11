import React, { useEffect, useState } from 'react';
import { getMetrics } from '../services/storageService';
import { Metrics } from '../types';

interface DashboardProps {
  onClose: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);

  useEffect(() => {
    setMetrics(getMetrics());
  }, []);

  const handleExport = () => {
    if (!metrics) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(metrics, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lifelens_metrics.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!metrics) return <div className="text-white p-8">Loading metrics...</div>;

  const Card = ({ title, value, subtext }: { title: string, value: string | number, subtext?: string }) => (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );

  return (
    <div className="bg-gray-950 min-h-screen p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
          <h2 className="text-3xl font-bold text-white">Metrics Dashboard</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white font-medium transition-colors">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card title="Total Analyses" value={metrics.total_images_analyzed} />
          <Card title="Repairs Logged" value={metrics.total_repairs} />
          <Card title="Food Items" value={metrics.total_food_items} />
          <Card 
             title="Avg. Calories" 
             value={Math.round(metrics.average_calorie_reduction)} 
             subtext="Per scanned meal"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-white">Repair Averages</h3>
            <div className="space-y-6">
               <div>
                 <div className="flex justify-between mb-2">
                   <span className="text-sm font-medium text-gray-400">Avg. Cost</span>
                   <span className="text-sm font-bold text-white">${Math.round(metrics.average_repair_cost)}</span>
                 </div>
                 <div className="w-full bg-gray-800 rounded-full h-2">
                   <div className="bg-green-500 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${Math.min(100, metrics.average_repair_cost / 5)}%` }}></div>
                 </div>
               </div>
               <div>
                 <div className="flex justify-between mb-2">
                   <span className="text-sm font-medium text-gray-400">Avg. Time</span>
                   <span className="text-sm font-bold text-white">{Math.round(metrics.average_repair_time)} min</span>
                 </div>
                 <div className="w-full bg-gray-800 rounded-full h-2">
                   <div className="bg-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${Math.min(100, metrics.average_repair_time)}%` }}></div>
                 </div>
               </div>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-800">
            <h3 className="text-lg font-bold mb-4 text-white">Safety Incidents</h3>
            <div className="flex items-center justify-center gap-8 h-32">
               <div className="text-center">
                  <div className="text-5xl font-bold text-red-500 drop-shadow-md">{metrics.safety_high_count}</div>
                  <div className="text-sm text-gray-400 mt-2">High Risk</div>
               </div>
               <div className="h-16 w-px bg-gray-700"></div>
               <div className="text-center">
                  <div className="text-5xl font-bold text-green-500 drop-shadow-md">{metrics.safety_low_medium_count}</div>
                  <div className="text-sm text-gray-400 mt-2">Safe / Low Risk</div>
               </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={handleExport} className="px-6 py-3 bg-gray-800 border border-gray-700 text-gray-200 rounded-lg hover:bg-gray-700 font-medium transition-all shadow-md">Export JSON</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;