
import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Pipeline, CustomField, AutomatedTaskTemplate, UserProfile } from '../types';

interface SettingsViewProps {
  pipelines: Pipeline[];
  customFields: CustomField[];
  currentUserProfile: UserProfile;
  team: UserProfile[];
  onUpdateProfile: (profile: UserProfile) => void;
  onAddTeamMember: (user: UserProfile) => void;
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
  currentUserProfile,
  team,
  onUpdateProfile,
  onAddTeamMember,
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
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'pipelines' | 'fields'>('profile');
  
  // Stany profilu
  const [profFirstName, setProfFirstName] = useState(currentUserProfile.firstName);
  const [profLastName, setProfLastName] = useState(currentUserProfile.lastName);

  // Stany zespołu
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberFirst, setNewMemberFirst] = useState('');
  const [newMemberLast, setNewMemberLast] = useState('');

  // Stany pipelines
  const [newPipelineName, setNewPipelineName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldTarget, setNewFieldTarget] = useState<'company' | 'contact'>('company');
  const [newFieldType, setNewFieldType] = useState<CustomField['type']>('text');

  const [addingStageTo, setAddingStageTo] = useState<string | null>(null);
  const [newStageName, setNewStageName] = useState('');
  const [automationStage, setAutomationStage] = useState<{ pipelineId: string, name: string } | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({ ...currentUserProfile, firstName: profFirstName, lastName: profLastName });
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;
    onAddTeamMember({
      id: crypto.randomUUID(),
      email: newMemberEmail,
      firstName: newMemberFirst,
      lastName: newMemberLast,
      role: 'User'
    });
    setNewMemberEmail('');
    setNewMemberFirst('');
    setNewMemberLast('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto max-w-full">
        <button onClick={() => setActiveTab('profile')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Mój Profil</button>
        <button onClick={() => setActiveTab('team')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Zespół</button>
        <button onClick={() => setActiveTab('pipelines')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'pipelines' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Procesy</button>
        <button onClick={() => setActiveTab('fields')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'fields' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Pola</button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm max-w-2xl">
          <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">Ustawienia Profilu</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Imię</label>
                <input value={profFirstName} onChange={e => setProfFirstName(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nazwisko</label>
                <input value={profLastName} onChange={e => setProfLastName(e.target.value)} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail (Login)</label>
              <input readOnly value={currentUserProfile.email} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold opacity-50 cursor-not-allowed" />
            </div>
            <button type="submit" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Zapisz zmiany profilu</button>
          </form>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Dodaj członka zespołu</h3>
            <form onSubmit={handleInviteMember} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input placeholder="Imię" value={newMemberFirst} onChange={e => setNewMemberFirst(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <input placeholder="Nazwisko" value={newMemberLast} onChange={e => setNewMemberLast(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <input type="email" placeholder="E-mail" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <button type="submit" className="bg-indigo-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Zaproś</button>
            </form>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr><th className="px-8 py-4">Użytkownik</th><th className="px-8 py-4">Rola</th><th className="px-8 py-4">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm">
                {team.map(u => (
                  <tr key={u.id}>
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-8 py-5"><span className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 px-2 py-1 rounded-lg">{u.role}</span></td>
                    <td className="px-8 py-5"><span className="text-[10px] font-black uppercase tracking-widest text-green-500">Aktywny</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'pipelines' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Nowy proces</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (newPipelineName) onAddPipeline({ id: crypto.randomUUID(), name: newPipelineName, stages: ['Nowy', 'Zamknięty'], automation: {} }); setNewPipelineName(''); }} className="flex gap-4">
              <input placeholder="Nazwa procesu..." value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)} className="flex-1 bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <button type="submit" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100">Dodaj</button>
            </form>
          </div>
          {pipelines.map(p => (
            <div key={p.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative group">
              <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">{p.name}</h4>
                <button onClick={() => onRemovePipeline(p.id)} className="text-rose-500 hover:text-rose-700 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Usuń proces</button>
              </div>
              <div className="flex items-center flex-wrap gap-4">
                {p.stages.map((s, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center min-w-[150px]">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">{s}</span>
                    <button onClick={() => onRemoveStage(p.id, s)} className="mt-4 text-[9px] opacity-0 hover:text-rose-600 transition-all font-black uppercase group-hover:opacity-100">Usuń</button>
                  </div>
                ))}
                <button onClick={() => { const s = prompt('Nazwa etapu:'); if(s) onAddStage(p.id, s); }} className="px-6 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all text-[10px] font-black uppercase tracking-widest">+ Etap</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Zdefiniuj nowe pole</h3>
            <form onSubmit={(e) => { e.preventDefault(); if (newFieldName) onAddField({ id: crypto.randomUUID(), label: newFieldName, target: newFieldTarget, type: newFieldType }); setNewFieldName(''); }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Etykieta pola..." value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <select value={newFieldTarget} onChange={(e) => setNewFieldTarget(e.target.value as any)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="company">Firma</option><option value="contact">Kontakt</option></select>
                <select value={newFieldType} onChange={(e) => setNewFieldType(e.target.value as any)} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="text">Tekst</option><option value="number">Liczba</option><option value="date">Data</option></select>
              </div>
              <button type="submit" className="md:col-span-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100">Dodaj pole</button>
            </form>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <tr><th className="px-8 py-4">Etykieta</th><th className="px-8 py-4">Obiekt</th><th className="px-8 py-4 text-right">Akcje</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customFields.map(f => (
                  <tr key={f.id}>
                    <td className="px-8 py-5 font-bold">{f.label}</td>
                    <td className="px-8 py-5"><span className="text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 px-2 py-1 rounded-lg">{f.target}</span></td>
                    <td className="px-8 py-5 text-right"><button onClick={() => onRemoveField(f.id)} className="text-rose-500 font-black text-[10px] uppercase">Usuń</button></td>
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
