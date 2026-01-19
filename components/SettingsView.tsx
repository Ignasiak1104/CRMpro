
import React, { useState } from 'react';
import { Pipeline, CustomField } from '../types';

interface SettingsViewProps {
  pipelines: Pipeline[];
  customFields: CustomField[];
  onAddPipeline: (p: Pipeline) => void;
  onAddField: (f: CustomField) => void;
  onReorderField: (index: number, direction: 'up' | 'down') => void;
  onReorderStage: (pipelineId: string, stageIndex: number, direction: 'up' | 'down') => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  pipelines, 
  customFields, 
  onAddPipeline, 
  onAddField, 
  onReorderField,
  onReorderStage
}) => {
  const [activeTab, setActiveTab] = useState<'pipelines' | 'fields'>('pipelines');
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldTarget, setNewFieldTarget] = useState<'company' | 'contact'>('company');
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const handleAddPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName) return;
    onAddPipeline({
      id: crypto.randomUUID(),
      name: newPipelineName,
      stages: ['Nowy', 'W kontakcie', 'Zamknięty']
    });
    setNewPipelineName('');
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName) return;
    onAddField({
      id: crypto.randomUUID(),
      label: newFieldName,
      target: newFieldTarget,
      type: newFieldType,
      options: newFieldType === 'select' ? newFieldOptions.split(',').map(o => o.trim()).filter(o => o) : undefined
    });
    setNewFieldName('');
    setNewFieldOptions('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button onClick={() => setActiveTab('pipelines')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pipelines' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Procesy Sprzedaży</button>
        <button onClick={() => setActiveTab('fields')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'fields' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Pola Niestandardowe</button>
      </div>

      {activeTab === 'pipelines' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Dodaj nowy proces</h3>
            <form onSubmit={handleAddPipeline} className="flex gap-4">
              <input type="text" placeholder="Nazwa procesu..." value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Dodaj</button>
            </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelines.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-black text-slate-900 mb-6">{p.name}</h4>
                <div className="space-y-2">
                  {p.stages.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-indigo-200">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">{s}</span>
                      <div className="flex space-x-1">
                        <button onClick={() => onReorderStage(p.id, idx, 'up')} className="text-slate-400 hover:text-indigo-600 transition-colors">↑</button>
                        <button onClick={() => onReorderStage(p.id, idx, 'down')} className="text-slate-400 hover:text-indigo-600 transition-colors">↓</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Zdefiniuj nowe pole</h3>
            <form onSubmit={handleAddField} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Etykieta pola..." value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newFieldTarget} onChange={(e) => setNewFieldTarget(e.target.value as any)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="company">Dla Firmy</option><option value="contact">Dla Kontaktu</option></select>
                <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as any)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="text">Tekst</option><option value="number">Liczba</option><option value="date">Data</option><option value="select">Lista (Select)</option></select>
              </div>
              {newFieldType === 'select' && (
                <input type="text" placeholder="Opcje oddzielone przecinkiem (np. Mała, Średnia, Duża)" value={newFieldOptions} onChange={(e) => setNewFieldOptions(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none md:col-span-2" />
              )}
              <button type="submit" className="md:col-span-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Dodaj pole niestandardowe</button>
            </form>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr><th className="px-8 py-4">Kolejność</th><th className="px-8 py-4">Etykieta</th><th className="px-8 py-4">Obiekt</th><th className="px-8 py-4">Typ</th><th className="px-8 py-4 text-right">Akcje</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {customFields.map((f, index) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 flex space-x-2"><button onClick={() => onReorderField(index, 'up')}>↑</button><button onClick={() => onReorderField(index, 'down')}>↓</button></td>
                    <td className="px-8 py-5 font-bold">{f.label}</td>
                    <td className="px-8 py-5"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${f.target === 'company' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{f.target === 'company' ? 'Firma' : 'Kontakt'}</span></td>
                    <td className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black">{f.type}</td>
                    <td className="px-8 py-5 text-right"><button className="text-rose-500 font-black text-[10px] uppercase">Usuń</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
