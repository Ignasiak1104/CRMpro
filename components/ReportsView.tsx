
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Deal, Stage } from '../types';

interface ReportsViewProps {
  deals: Deal[];
}

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f1f5f9'];

const ReportsView: React.FC<ReportsViewProps> = ({ deals }) => {
  const kpis = useMemo(() => {
    const wonDeals = deals.filter(d => d.stage === Stage.WON);
    const totalSales = wonDeals.reduce((acc, d) => acc + d.value, 0);
    const avgValue = wonDeals.length > 0 ? totalSales / wonDeals.length : 0;
    
    return {
      totalSales,
      wonCount: wonDeals.length,
      avgValue,
      activePipeline: deals.filter(d => d.stage !== Stage.WON && d.stage !== Stage.LOST)
        .reduce((acc, d) => acc + d.value, 0)
    };
  }, [deals]);

  const chartData = useMemo(() => {
    const stages = Object.values(Stage);
    const pipelineDistribution = stages.map(stage => ({
      name: stage,
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((acc, d) => acc + d.value, 0)
    }));

    const industryData = [
      { name: 'IT', value: 400 },
      { name: 'Budownictwo', value: 300 },
      { name: 'OZE', value: 200 },
      { name: 'Logistyka', value: 100 },
    ];

    return { pipelineDistribution, industryData };
  }, [deals]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Suma Sprzedaży</p>
          <h3 className="text-2xl font-black text-slate-900">{(kpis.totalSales / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">PLN</span></h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Pozyskani Klienci</p>
          <h3 className="text-2xl font-black text-slate-900">{kpis.wonCount}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Średnia Transakcja</p>
          <h3 className="text-2xl font-black text-slate-900">{(kpis.avgValue / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">PLN</span></h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Wartość Pipeline</p>
          <h3 className="text-2xl font-black text-indigo-600">{(kpis.activePipeline / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">PLN</span></h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Distribution Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Dystrybucja Pipeline (Liczba)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData.pipelineDistribution}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Value Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Wartość ofert wg etapów</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={chartData.pipelineDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.pipelineDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
