
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Pipeline, CustomField, AutomatedTaskTemplate } from '../types';

interface SettingsViewProps {
  pipelines: Pipeline[];
  customFields: CustomField[];
  onAddPipeline: (p: Pipeline) => void;
  onAddField: (f: CustomField) => void;
  onReorderField: (index: number, direction: 'up' | 'down') => void;
  onMoveStage: (pipelineId: string, sourceIndex: number, destinationIndex: number) => void;
  onAddStage: (pipelineId: string, stageName: string) => void;
  onEditStage: (pipelineId: string, oldName: string, newName: string) => void;
  onRemoveStage: (pipelineId: string, stageName: string) => void;
  onRemoveField: (fieldId: string) => void;
  onRemovePipeline: (pipelineId: string) => void;
  onUpdateAutomation: (pipelineId: string, stageName: string, templates: AutomatedTaskTemplate[]) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  pipelines, 
  customFields, 
  onAddPipeline, 
  onAddField, 
  onReorderField,
  onMoveStage,
  onAddStage,
  onEditStage,
  onRemoveStage,
  onRemoveField,
  onRemovePipeline,
  onUpdateAutomation
}) => {
  const [activeTab, setActiveTab] = useState<'pipelines' | 'fields'>('pipelines');
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldTarget, setNewFieldTarget] = useState<'company' | 'contact'>('company');
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');

  // Stany dla edycji etapów
  const [addingStageTo, setAddingStageTo] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [editingStage, setEditingStage] = useState<{ pipelineId: string, name: string } | null>(null);
  const [editStageName, setEditStageName] = useState('');

  // Stany dla automatyzacji
  const [automationStage, setAutomationStage] = useState<{ pipelineId: string, name: string } | null>(null);
  const [newAutoTask, setNewAutoTask] = useState({ title: '', daysOffset: 0, priority: 'Medium' as AutomatedTaskTemplate['priority'] });

  const handleAddPipeline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPipelineName) return;
    onAddPipeline({
      id: crypto.randomUUID(),
      name: newPipelineName,
      stages: ['Nowy', 'W kontakcie', 'Zamknięty'],
      automation: {}
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

  const onDragEnd = (result: DropResult, pipelineId: string) => {
    if (!result.destination) return;
    onMoveStage(pipelineId, result.source.index, result.destination.index);
  };

  const submitNewStage = (pipelineId: string) => {
    if (!newStageName.trim()) return;
    onAddStage(pipelineId, newStageName.trim());
    setNewStageName('');
    setAddingStageTo(null);
  };

  const submitEditStage = () => {
    if (!editingStage || !editStageName.trim()) return;
    onEditStage(editingStage.pipelineId, editingStage.name, editStageName.trim());
    setEditingStage(null);
    setEditStageName('');
  };

  const handleAddAutoTask = () => {
    if (!automationStage || !newAutoTask.title.trim()) return;
    const currentPipeline = pipelines.find(p => p.id === automationStage.pipelineId);
    if (!currentPipeline) return;

    const currentTemplates = currentPipeline.automation?.[automationStage.name] || [];
    const newTemplate: AutomatedTaskTemplate = {
      id: crypto.randomUUID(),
      title: newAutoTask.title,
      daysOffset: newAutoTask.daysOffset,
      priority: newAutoTask.priority
    };

    onUpdateAutomation(automationStage.pipelineId, automationStage.name, [...currentTemplates, newTemplate]);
    setNewAutoTask({ title: '', daysOffset: 0, priority: 'Medium' });
  };

  const handleRemoveAutoTask = (templateId: string) => {
    if (!automationStage) return;
    const currentPipeline = pipelines.find(p => p.id === automationStage.pipelineId);
    const currentTemplates = currentPipeline?.automation?.[automationStage.name] || [];
    onUpdateAutomation(automationStage.pipelineId, automationStage.name, currentTemplates.filter(t => t.id !== templateId));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
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
          
          <div className="space-y-6">
            {pipelines.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
                <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">{p.name}</h4>
                  <div className="flex items-center space-x-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.stages.length} etapów</span>
                    <button 
                      onClick={() => onRemovePipeline(p.id)}
                      className="text-rose-500 hover:text-rose-700 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Usuń proces
                    </button>
                  </div>
                </div>
                
                <DragDropContext onDragEnd={(res) => onDragEnd(res, p.id)}>
                  <Droppable droppableId={p.id} direction="horizontal">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className="flex items-center flex-wrap gap-y-6 min-h-[140px]"
                      >
                        {p.stages.map((s, idx) => {
                          const isEditing = editingStage?.pipelineId === p.id && editingStage?.name === s;
                          const hasAutomation = (p.automation?.[s]?.length || 0) > 0;
                          return (
                            <Draggable key={`${p.id}-${s}-${idx}`} draggableId={`${p.id}-${s}-${idx}`} index={idx}>
                              {(draggableProvided, snapshot) => (
                                <React.Fragment>
                                  <div 
                                    ref={draggableProvided.innerRef}
                                    {...draggableProvided.draggableProps}
                                    {...draggableProvided.dragHandleProps}
                                    className="flex items-center group/stage"
                                  >
                                    <div className={`relative flex flex-col items-center bg-slate-50 p-6 rounded-3xl border transition-all min-w-[180px] ${
                                      snapshot.isDragging 
                                        ? 'border-indigo-600 bg-white shadow-2xl scale-105 z-50 ring-2 ring-indigo-100' 
                                        : 'border-slate-100 hover:border-indigo-300 hover:bg-white shadow-sm hover:shadow-md'
                                    }`}>
                                      {isEditing ? (
                                        <div className="flex flex-col space-y-2 w-full">
                                          <input 
                                            autoFocus
                                            value={editStageName}
                                            onChange={(e) => setEditStageName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && submitEditStage()}
                                            className="w-full text-xs font-bold p-2 rounded-lg border-2 border-indigo-200 outline-none"
                                          />
                                          <div className="flex justify-center space-x-2">
                                            <button onClick={submitEditStage} className="text-[9px] font-black text-green-600 uppercase">Zapisz</button>
                                            <button onClick={() => setEditingStage(null)} className="text-[9px] font-black text-slate-400 uppercase">Anuluj</button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <span className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">{s}</span>
                                          <div className="flex items-center space-x-4">
                                             <button 
                                              onClick={() => {
                                                setEditingStage({ pipelineId: p.id, name: s });
                                                setEditStageName(s);
                                              }}
                                              className="text-[10px] opacity-0 group-hover/stage:opacity-100 hover:text-indigo-600 transition-all"
                                             >
                                              ✏️
                                             </button>
                                             <button 
                                              onClick={() => setAutomationStage({ pipelineId: p.id, name: s })}
                                              className={`text-[10px] transition-all flex items-center gap-1 font-black uppercase tracking-widest ${hasAutomation ? 'text-indigo-600 opacity-100' : 'opacity-0 group-hover/stage:opacity-100 text-slate-400 hover:text-indigo-500'}`}
                                             >
                                              🤖 {hasAutomation && `(${p.automation![s].length})`}
                                             </button>
                                             <button 
                                              onClick={() => onRemoveStage(p.id, s)}
                                              className="text-[10px] opacity-0 group-hover/stage:opacity-100 hover:text-rose-600 transition-all"
                                             >
                                              🗑️
                                             </button>
                                          </div>
                                        </>
                                      )}
                                      
                                      <div className="absolute -top-3 -left-3 w-7 h-7 bg-white border border-slate-100 rounded-full flex items-center justify-center text-[10px] font-black text-slate-300 shadow-sm">
                                        {idx + 1}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {idx < p.stages.length - 1 && !snapshot.isDragging && (
                                    <div className="px-2 flex items-center justify-center">
                                      <div className="w-6 h-[2px] bg-slate-100 relative">
                                         <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-100" />
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                        
                        {/* Formularz dodawania etapu */}
                        <div className="ml-4">
                          {addingStageTo === p.id ? (
                            <div className="flex items-center space-x-2 bg-indigo-50 p-4 rounded-3xl border border-indigo-100 animate-in zoom-in duration-200">
                              <input 
                                autoFocus
                                placeholder="Nazwa etapu..."
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && submitNewStage(p.id)}
                                className="bg-white border-none rounded-xl p-2 text-xs font-bold outline-none ring-2 ring-indigo-200"
                              />
                              <button onClick={() => submitNewStage(p.id)} className="text-indigo-600 font-black text-xl">✓</button>
                              <button onClick={() => setAddingStageTo(null)} className="text-slate-400 font-black text-xl">✕</button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setAddingStageTo(p.id)}
                              className="px-6 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all text-xs font-black uppercase tracking-widest"
                            >
                              + Dodaj etap
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
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
                {customFields.length > 0 ? customFields.map((f, index) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex space-x-2">
                        <button onClick={() => onReorderField(index, 'up')} disabled={index === 0} className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 font-bold">↑</button>
                        <button onClick={() => onReorderField(index, 'down')} disabled={index === customFields.length - 1} className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 font-bold">↓</button>
                      </div>
                    </td>
                    <td className="px-8 py-5 font-bold">{f.label}</td>
                    <td className="px-8 py-5"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${f.target === 'company' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>{f.target === 'company' ? 'Firma' : 'Kontakt'}</span></td>
                    <td className="px-8 py-5 text-slate-400 uppercase text-[10px] font-black">{f.type}</td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => onRemoveField(f.id)}
                        className="text-rose-500 hover:text-rose-700 font-black text-[10px] uppercase tracking-widest transition-colors"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-10 text-center text-slate-400 font-medium italic">Brak zdefiniowanych pól niestandardowych.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Automatyzacji */}
      {automationStage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">🤖 Automatyzacja Etapu</h3>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Etap: {automationStage.name}</p>
              </div>
              <button onClick={() => setAutomationStage(null)} className="text-slate-300 hover:text-slate-500 text-2xl font-black transition-colors">✕</button>
            </div>

            <div className="space-y-10">
              <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Dodaj nowe zadanie automatyczne</h4>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Tytuł zadania (użyj {deal} dla nazwy transakcji)..." 
                    value={newAutoTask.title}
                    onChange={(e) => setNewAutoTask({...newAutoTask, title: e.target.value})}
                    className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wykonaj po (dniach)</label>
                      <input 
                        type="number" 
                        value={newAutoTask.daysOffset}
                        onChange={(e) => setNewAutoTask({...newAutoTask, daysOffset: Number(e.target.value)})}
                        className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priorytet</label>
                      <select 
                        value={newAutoTask.priority}
                        onChange={(e) => setNewAutoTask({...newAutoTask, priority: e.target.value as any})}
                        className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm"
                      >
                        <option value="Low">Niski</option>
                        <option value="Medium">Średni</option>
                        <option value="High">Wysoki</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={handleAddAutoTask}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                  >
                    Dodaj do etapu
                  </button>
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Zdefiniowane zadania ({pipelines.find(p => p.id === automationStage.pipelineId)?.automation?.[automationStage.name]?.length || 0})</h4>
                <div className="space-y-3">
                  {(pipelines.find(p => p.id === automationStage.pipelineId)?.automation?.[automationStage.name] || []).map(tpl => (
                    <div key={tpl.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl shadow-sm group hover:border-indigo-200 transition-all">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{tpl.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Termin: +{tpl.daysOffset} dni</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            tpl.priority === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
                          }`}>{tpl.priority}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveAutoTask(tpl.id)}
                        className="text-slate-300 hover:text-rose-500 font-bold transition-colors opacity-0 group-hover:opacity-100"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  {(!pipelines.find(p => p.id === automationStage.pipelineId)?.automation?.[automationStage.name]?.length) && (
                    <div className="text-center p-10 border-2 border-dashed border-slate-100 rounded-[32px]">
                      <span className="text-3xl block mb-2 opacity-20">🤖</span>
                      <p className="text-xs text-slate-400 font-bold">Brak zadań automatycznych dla tego etapu.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
            
            <div className="mt-10 pt-6 border-t border-slate-50">
              <button 
                onClick={() => setAutomationStage(null)}
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Zamknij ustawienia automatyzacji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
