
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Deal, Company, Pipeline } from '../types';

interface ReportsViewProps {
  deals: Deal[];
  companies: Company[];
  pipelines: Pipeline[];
}

const COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#f1f5f9'];

const ReportsView: React.FC<ReportsViewProps> = ({ deals, companies, pipelines }) => {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>(pipelines[0]?.id || '');
  const [selectedOwner, setSelectedOwner] = useState<string>('');

  const owners = useMemo(() => {
    const o = deals.map(d => d.owner).filter(Boolean);
    return Array.from(new Set(o)).sort();
  }, [deals]);

  const activePipeline = useMemo(() => 
    pipelines.find(p => p.id === selectedPipelineId) || pipelines[0], 
  [pipelines, selectedPipelineId]);

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (selectedPipelineId && deal.pipelineId !== selectedPipelineId) return false;
      if (selectedOwner && deal.owner !== selectedOwner) return false;
      return true;
    });
  }, [deals, selectedPipelineId, selectedOwner]);

  const kpis = useMemo(() => {
    const wonDeals = filteredDeals.filter(d => d.stage === 'Pozyskany');
    const totalSales = wonDeals.reduce((acc, d) => acc + d.value, 0);
    const avgValue = wonDeals.length > 0 ? totalSales / wonDeals.length : 0;
    
    return {
      totalSales,
      wonCount: wonDeals.length,
      avgValue,
      activePipeline: filteredDeals.filter(d => d.stage !== 'Pozyskany' && d.stage !== 'Utracony')
        .reduce((acc, d) => acc + d.value, 0)
    };
  }, [filteredDeals]);

  const chartData = useMemo(() => {
    if (!activePipeline) return { pipelineDistribution: [] };
    
    const pipelineDistribution = activePipeline.stages.map(stage => ({
      name: stage,
      count: filteredDeals.filter(d => d.stage === stage).length,
      value: filteredDeals.filter(d => d.stage === stage).reduce((acc, d) => acc + d.value, 0)
    }));

    return { pipelineDistribution };
  }, [filteredDeals, activePipeline]);

  const resetFilters = () => {
    setSelectedPipelineId(pipelines[0]?.id || '');
    setSelectedOwner('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Panel Filtrów */}
      <div className="bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl shadow-indigo-100/20">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Proces Sprzedaży</label>
            <select 
              value={selectedPipelineId} 
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm"
            >
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Właściciel Transakcji</label>
            <select 
              value={selectedOwner} 
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm"
            >
              <option value="">Wszyscy właściciele</option>
              {owners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={resetFilters}
            className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            Resetuj
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Suma Sprzedaży</p>
          <h3 className="text-2xl font-black text-slate-900">{(kpis.totalSales / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">PLN</span></h3>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Pozyskani Klienci</p>
          <h3 className="text-2xl font-black text-slate-900">{kpis.wonCount}</h3>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Średnia Transakcja</p>
          <h3 className="text-2xl font-black text-slate-900">{(kpis.avgValue / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">PLN</span></h3>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.02]">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Wartość Pipeline</p>
          <h3 className="text-2xl font-black text-indigo-600">{(kpis.activePipeline / 1000).toFixed(1)}k <span className="text-sm font-normal text-slate-400">PLN</span></h3>
        </div>
      </div>

      {filteredDeals.length === 0 ? (
        <div className="bg-indigo-50/50 p-20 rounded-[40px] text-center border border-indigo-100 animate-in zoom-in duration-500">
           <span className="text-5xl block mb-6 opacity-30">🕵️‍♂️</span>
           <h3 className="text-xl font-bold text-indigo-900">Brak danych dla wybranych filtrów</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm h-[450px]">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">Dystrybucja Pipeline (Liczba)</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={chartData.pipelineDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', padding: '16px' }} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[12, 12, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm h-[450px]">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-10">Wartość ofert wg etapów</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={chartData.pipelineDistribution} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value">
                  {chartData.pipelineDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold', padding: '16px' }} formatter={(value: number) => [`${value.toLocaleString()} PLN`, 'Wartość']} />
                <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
