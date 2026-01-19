
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
      type: newFieldType
    });
    setNewFieldName('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('pipelines')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pipelines' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Procesy Sprzedaży
        </button>
        <button 
          onClick={() => setActiveTab('fields')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'fields' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Pola Niestandardowe
        </button>
      </div>

      {activeTab === 'pipelines' ? (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Dodaj nowy proces</h3>
            <form onSubmit={handleAddPipeline} className="flex gap-4">
              <input 
                type="text" 
                placeholder="Nazwa procesu (np. Upselling)"
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Dodaj
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pipelines.map(p => (
              <div key={p.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="font-black text-slate-900">{p.name}</h4>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.stages.length} etapów</span>
                </div>
                <div className="space-y-2">
                  {p.stages.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between group bg-slate-50 p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                      <div className="flex items-center space-x-3">
                        <span className="w-5 h-5 flex items-center justify-center bg-indigo-600 text-white text-[10px] font-black rounded-lg">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                          {s}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          disabled={idx === 0}
                          onClick={() => onReorderStage(p.id, idx, 'up')}
                          className={`p-1.5 rounded-lg transition-colors ${idx === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}
                        >
                          ↑
                        </button>
                        <button 
                          disabled={idx === p.stages.length - 1}
                          onClick={() => onReorderStage(p.id, idx, 'down')}
                          className={`p-1.5 rounded-lg transition-colors ${idx === p.stages.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}
                        >
                          ↓
                        </button>
                        <button className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="w-full mt-2 py-3 border-2 border-dashed border-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all">
                    + Dodaj etap
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Zdefiniuj nowe pole</h3>
            <form onSubmit={handleAddField} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                type="text" 
                placeholder="Etykieta (np. Rozmiar firmy)"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                className="md:col-span-2 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
              />
              <select 
                value={newFieldTarget}
                onChange={(e) => setNewFieldTarget(e.target.value as any)}
                className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value="company">Dla Firmy</option>
                <option value="contact">Dla Kontaktu</option>
              </select>
              <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Dodaj pole
              </button>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr>
                  <th className="px-8 py-4 w-24">Kolejność</th>
                  <th className="px-8 py-4">Etykieta</th>
                  <th className="px-8 py-4">Obiekt</th>
                  <th className="px-8 py-4">Typ</th>
                  <th className="px-8 py-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {customFields.map((f, index) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2">
                        <button 
                          disabled={index === 0}
                          onClick={() => onReorderField(index, 'up')}
                          className={`p-1 rounded-lg transition-colors ${index === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
                        >
                          ↑
                        </button>
                        <button 
                          disabled={index === customFields.length - 1}
                          onClick={() => onReorderField(index, 'down')}
                          className={`p-1 rounded-lg transition-colors ${index === customFields.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
                        >
                          ↓
                        </button>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-800">{f.label}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${f.target === 'company' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {f.target === 'company' ? 'Firma' : 'Kontakt'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-slate-400 font-medium uppercase text-[10px]">{f.type}</td>
                    <td className="px-8 py-5 text-right">
                      <button className="text-rose-500 text-xs font-black uppercase tracking-widest hover:text-rose-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        Usuń
                      </button>
                    </td>
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
