
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import CompanyDetailPanel from './components/CompanyDetailPanel';
import NotificationCenter from './components/NotificationCenter';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { INITIAL_COMPANIES, INITIAL_CONTACTS, INITIAL_DEALS, INITIAL_TASKS } from './constants';
import { Company, Contact, Deal, Task, ViewType, Stage, Pipeline, CustomField } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Settings States
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    { id: 'p1', name: 'Sprzedaż standardowa', stages: Object.values(Stage) }
  ]);
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: 'f1', label: 'Wielkość zatrudnienia', target: 'company', type: 'number' },
    { id: 'f2', label: 'LinkedIn URL', target: 'contact', type: 'text' }
  ]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  
  // Modals States
  const [activeModal, setActiveModal] = useState<'company' | 'contact' | 'deal' | 'task' | null>(null);

  // Form States
  const [newCompany, setNewCompany] = useState({ name: '', industry: '', status: 'Prospect' as Company['status'], website: '', customValues: {} as Record<string, any> });
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', companyId: '', customValues: {} as Record<string, any> });
  const [newDeal, setNewDeal] = useState({ title: '', value: 0, stage: Stage.NEW, expectedCloseDate: '', companyId: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'Medium' as Task['priority'], relatedId: '' });

  // Handle Auth Session
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase!.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;
      
      setLoading(true);
      if (!isSupabaseConfigured || !supabase) {
        setCompanies(INITIAL_COMPANIES);
        setContacts(INITIAL_CONTACTS);
        setDeals(INITIAL_DEALS);
        setTasks(INITIAL_TASKS);
        setLoading(false);
        return;
      }
      try {
        const [c, co, d, t] = await Promise.all([
          supabase.from('companies').select('*').order('createdAt', { ascending: false }),
          supabase.from('contacts').select('*'),
          supabase.from('deals').select('*'),
          supabase.from('tasks').select('*')
        ]);
        if (c.data) setCompanies(c.data);
        if (co.data) setContacts(co.data);
        if (d.data) setDeals(d.data);
        if (t.data) setTasks(t.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.industry.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(co => 
      co.firstName.toLowerCase().includes(query) || 
      co.lastName.toLowerCase().includes(query) || 
      co.email.toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    
    if (editingCompanyId) {
      setCompanies(prev => prev.map(c => 
        c.id === editingCompanyId ? { ...c, ...newCompany } : c
      ));
      if (isSupabaseConfigured && supabase) {
        await supabase.from('companies').update(newCompany).eq('id', editingCompanyId);
      }
    } else {
      const data: Company = { id: crypto.randomUUID(), ...newCompany, createdAt: new Date().toISOString() };
      if (isSupabaseConfigured && supabase) await supabase.from('companies').insert([data]);
      setCompanies(prev => [data, ...prev]);
    }
    
    setActiveModal(null);
    setEditingCompanyId(null);
    setNewCompany({ name: '', industry: '', status: 'Prospect', website: '', customValues: {} });
    setSyncing(false);
  };

  const handleEditCompany = (company: Company) => {
    setNewCompany({
      name: company.name,
      industry: company.industry,
      status: company.status,
      website: company.website,
      customValues: company.customValues || {}
    });
    setEditingCompanyId(company.id);
    setActiveModal('company');
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    const data: Contact = { id: crypto.randomUUID(), ...newContact };
    if (isSupabaseConfigured && supabase) await supabase.from('contacts').insert([data]);
    setContacts(prev => [data, ...prev]);
    setActiveModal(null);
    setNewContact({ firstName: '', lastName: '', email: '', phone: '', role: '', companyId: '', customValues: {} });
    setSyncing(false);
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    const data: Deal = { id: crypto.randomUUID(), ...newDeal };
    if (isSupabaseConfigured && supabase) await supabase.from('deals').insert([data]);
    setDeals(prev => [data, ...prev]);
    setActiveModal(null);
    setNewDeal({ title: '', value: 0, stage: Stage.NEW, expectedCloseDate: '', companyId: '' });
    setSyncing(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    const data: Task = { id: crypto.randomUUID(), ...newTask, isCompleted: false };
    if (isSupabaseConfigured && supabase) await supabase.from('tasks').insert([data]);
    setTasks(prev => [data, ...prev]);
    setActiveModal(null);
    setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium' as Task['priority'], relatedId: '' });
    setSyncing(false);
  };

  const handleMoveDeal = async (dealId: string, newStage: Stage) => {
    setSyncing(true);
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    if (isSupabaseConfigured && supabase) await supabase.from('deals').update({ stage: newStage }).eq('id', dealId);
    setTimeout(() => setSyncing(false), 500);
  };

  const toggleTask = async (taskId: string) => {
    setSyncing(true);
    const taskToToggle = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
    if (isSupabaseConfigured && supabase) await supabase.from('tasks').update({ isCompleted: !taskToToggle?.isCompleted }).eq('id', taskId);
    setTimeout(() => setSyncing(false), 500);
  };

  const handleReorderField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...customFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setCustomFields(newFields);
  };

  const handleReorderStage = (pipelineId: string, stageIndex: number, direction: 'up' | 'down') => {
    setPipelines(prev => prev.map(p => {
      if (p.id !== pipelineId) return p;
      const newStages = [...p.stages];
      const targetIndex = direction === 'up' ? stageIndex - 1 : stageIndex + 1;
      if (targetIndex < 0 || targetIndex >= newStages.length) return p;
      [newStages[stageIndex], newStages[targetIndex]] = [newStages[targetIndex], newStages[stageIndex]];
      return { ...p, stages: newStages };
    }));
  };

  const stats = useMemo(() => ({
    total: deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    tasks: tasks.filter(t => !t.isCompleted).length
  }), [deals, tasks]);

  const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);

  const renderCustomFieldInputs = (target: 'company' | 'contact', state: any, setState: any) => {
    const fields = customFields.filter(f => f.target === target);
    if (fields.length === 0) return null;

    return (
      <div className="space-y-4 pt-4 border-t border-slate-50 mt-4">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pola niestandardowe</h4>
        <div className="grid grid-cols-1 gap-4">
          {fields.map(f => (
            <div key={f.id}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={state.customValues[f.id] || ''}
                  onChange={e => setState({ ...state, customValues: { ...state.customValues, [f.id]: e.target.value } })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="">Wybierz...</option>
                  {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                  placeholder={f.label}
                  value={state.customValues[f.id] || ''}
                  onChange={e => setState({ ...state, customValues: { ...state.customValues, [f.id]: e.target.value } })}
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return <AuthView />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} userEmail={session.user.email} />
      <main className="flex-1 ml-64 p-10 max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{currentView}</h1>
          <div className="flex items-center space-x-4">
            <NotificationCenter tasks={tasks} />
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-indigo-600"></div>
              <span className="text-xs font-bold text-slate-700">{session.user.email.split('@')[0]}</span>
            </div>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Pipeline</p>
              <h3 className="text-4xl font-black">{(stats.total / 1000).toFixed(0)}k <span className="text-lg">PLN</span></h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Zadania</p>
              <h3 className="text-4xl font-black">{stats.tasks} <span className="text-lg">do zrobienia</span></h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Firmy</p>
              <h3 className="text-4xl font-black">{companies.length} <span className="text-lg">klientów</span></h3>
            </div>
          </div>
        )}

        {currentView === 'companies' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-xl mr-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input type="text" placeholder="Szukaj firmy..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm transition-all" />
              </div>
              <button onClick={() => { setEditingCompanyId(null); setNewCompany({ name: '', industry: '', status: 'Prospect', website: '', customValues: {} }); setActiveModal('company'); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj firmę</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr><th className="px-8 py-4">Firma</th><th className="px-8 py-4">Status</th><th className="px-8 py-4">Branża</th><th className="px-8 py-4">Utworzono</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredCompanies.map(c => (
                    <tr key={c.id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedCompanyId === c.id ? 'bg-indigo-50/50' : ''}`} onClick={() => setSelectedCompanyId(c.id)}>
                      <td className="px-8 py-5 font-bold"><div>{c.name}<span className="block text-[10px] text-slate-400 font-medium">{c.website}</span></div></td>
                      <td className="px-8 py-5"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${c.status === 'Active' ? 'bg-green-50 text-green-600' : c.status === 'Prospect' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span></td>
                      <td className="px-8 py-5 text-slate-500">{c.industry}</td>
                      <td className="px-8 py-5 text-slate-400 text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'contacts' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-xl mr-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input type="text" placeholder="Szukaj kontaktu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm transition-all" />
              </div>
              <button onClick={() => setActiveModal('contact')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj kontakt</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr><th className="px-8 py-4">Imię i Nazwisko</th><th className="px-8 py-4">Firma</th><th className="px-8 py-4">E-mail</th><th className="px-8 py-4">Rola</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredContacts.map(co => (
                    <tr key={co.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-bold">{co.firstName} {co.lastName}</td>
                      <td className="px-8 py-5 text-slate-500">{companies.find(c => c.id === co.companyId)?.name || 'Niezależny'}</td>
                      <td className="px-8 py-5 text-indigo-600 font-medium">{co.email}</td>
                      <td className="px-8 py-5 text-slate-400">{co.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'kanban' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-bold text-slate-800">Lejek Sprzedażowy</h2>
              <button onClick={() => setActiveModal('deal')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj szansę</button>
            </div>
            <KanbanBoard deals={deals} companies={companies} onMoveDeal={handleMoveDeal} />
          </div>
        )}
        
        {currentView === 'reports' && <ReportsView deals={deals} />}
        
        {currentView === 'settings' && (
          <SettingsView 
            pipelines={pipelines} customFields={customFields}
            onAddPipeline={(p) => setPipelines([...pipelines, p])}
            onAddField={(f) => setCustomFields([...customFields, f])}
            onReorderField={handleReorderField} onReorderStage={handleReorderStage}
          />
        )}
        
        {currentView === 'tasks' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Moje Zadania</h2>
              <button onClick={() => setActiveModal('task')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj zadanie</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center justify-between p-6 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${t.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200'}`}>{t.isCompleted && '✓'}</button>
                    <div>
                      <span className={`font-bold block ${t.isCompleted ? 'line-through text-slate-300' : 'text-slate-800'}`}>{t.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{companies.find(c => c.id === t.relatedId)?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${t.priority === 'High' ? 'bg-rose-50 text-rose-600' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{t.priority}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Termin: {t.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selectedCompany && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40 animate-in fade-in" onClick={() => setSelectedCompanyId(null)} />
          <CompanyDetailPanel 
            company={selectedCompany} deals={deals.filter(d => d.companyId === selectedCompanyId)}
            contacts={contacts.filter(co => co.companyId === selectedCompanyId)}
            tasks={tasks.filter(t => t.relatedId === selectedCompanyId)}
            onClose={() => setSelectedCompanyId(null)} onEdit={() => handleEditCompany(selectedCompany)}
            onAddTask={() => { setNewTask(prev => ({ ...prev, relatedId: selectedCompanyId })); setActiveModal('task'); }}
            customFields={customFields}
          />
        </>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl custom-scrollbar animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-50 sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{activeModal === 'company' ? 'Dane Firmy' : activeModal === 'contact' ? 'Nowy Kontakt' : activeModal === 'deal' ? 'Nowa Szansa' : 'Nowe Zadanie'}</h3>
            </div>
            
            <form onSubmit={activeModal === 'company' ? handleSaveCompany : activeModal === 'contact' ? handleAddContact : activeModal === 'deal' ? handleAddDeal : handleAddTask} className="p-8 space-y-4">
              {activeModal === 'company' && (
                <>
                  <input required type="text" placeholder="Nazwa Firmy" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Branża" value={newCompany.industry} onChange={e => setNewCompany({...newCompany, industry: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <select value={newCompany.status} onChange={e => setNewCompany({...newCompany, status: e.target.value as Company['status']})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="Prospect">Prospect</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
                  </div>
                  <input type="text" placeholder="Strona WWW" value={newCompany.website} onChange={e => setNewCompany({...newCompany, website: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  {renderCustomFieldInputs('company', newCompany, setNewCompany)}
                </>
              )}

              {activeModal === 'contact' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="text" placeholder="Imię" value={newContact.firstName} onChange={e => setNewContact({...newContact, firstName: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <input required type="text" placeholder="Nazwisko" value={newContact.lastName} onChange={e => setNewContact({...newContact, lastName: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <input required type="email" placeholder="E-mail" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  <select required value={newContact.companyId} onChange={e => setNewContact({...newContact, companyId: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="">Wybierz firmę...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  {renderCustomFieldInputs('contact', newContact, setNewContact)}
                </>
              )}

              {activeModal === 'deal' && (
                <>
                  <input required type="text" placeholder="Tytuł szansy" value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="number" placeholder="Wartość" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <input required type="date" value={newDeal.expectedCloseDate} onChange={e => setNewDeal({...newDeal, expectedCloseDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  </div>
                  <select required value={newDeal.companyId} onChange={e => setNewDeal({...newDeal, companyId: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="">Wybierz firmę...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                </>
              )}

              {activeModal === 'task' && (
                <>
                  <input required type="text" placeholder="Tytuł zadania" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                  <textarea placeholder="Opis" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none h-24" />
                  <div className="grid grid-cols-2 gap-4">
                    <input required type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as Task['priority']})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select>
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                <button type="button" onClick={() => { setActiveModal(null); setEditingCompanyId(null); }} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Anuluj</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Zapisz</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {syncing && <div className="fixed bottom-10 right-10 bg-slate-900 text-white px-4 py-2 rounded-full text-[10px] font-black shadow-2xl animate-pulse">Synchronizacja...</div>}
    </div>
  );
};

export default App;
