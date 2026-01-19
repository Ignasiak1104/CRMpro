
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
import { Company, Contact, Deal, Task, ViewType, Stage, Pipeline, CustomField, AutomatedTaskTemplate, UserProfile } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [team, setTeam] = useState<UserProfile[]>([
    { id: 'u1', email: 'adam.nowak@moderncrm.pro', firstName: 'Adam', lastName: 'Nowak', role: 'Admin' },
    { id: 'u2', email: 'ewa.kowalska@moderncrm.pro', firstName: 'Ewa', lastName: 'Kowalska', role: 'User' }
  ]);

  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>({
    id: 'u1', email: 'demo@moderncrm.pro', firstName: 'Demo', lastName: 'User', role: 'Admin'
  });

  const [pipelines, setPipelines] = useState<Pipeline[]>([
    { id: 'p1', name: 'Sprzedaż standardowa', stages: Object.values(Stage), automation: {} }
  ]);
  const [activePipelineId, setActivePipelineId] = useState<string>('p1');

  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: 'f1', label: 'Wielkość zatrudnienia', target: 'company', type: 'number' },
    { id: 'f2', label: 'LinkedIn URL', target: 'contact', type: 'text' }
  ]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'company' | 'contact' | 'deal' | 'task' | null>(null);

  const [newCompany, setNewCompany] = useState({ name: '', industry: '', status: 'Prospect' as Company['status'], website: '', owner: '', customValues: {} as Record<string, any> });
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', owner: '', companyId: '', customValues: {} as Record<string, any> });
  const [newDeal, setNewDeal] = useState({ title: '', value: 0, stage: '', expectedCloseDate: '', owner: '', companyId: '', pipelineId: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'Medium' as Task['priority'], relatedId: '' });

  useEffect(() => {
    let authSubscription: any = null;
    const initAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setSession({ user: { email: 'demo@moderncrm.pro' } });
        setLoading(false);
        return;
      }
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          setCurrentUserProfile(prev => ({ ...prev, email: currentSession.user.email || prev.email, id: currentSession.user.id }));
        }
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession);
        });
        authSubscription = subscription;
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
    return () => { if (authSubscription) authSubscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!session) return;
      if (!isSupabaseConfigured || !supabase) {
        setCompanies(INITIAL_COMPANIES);
        setContacts(INITIAL_CONTACTS);
        setDeals(INITIAL_DEALS);
        setTasks(INITIAL_TASKS);
        return;
      }

      setSyncing(true);
      try {
        const [compRes, contRes, dealRes, taskRes] = await Promise.all([
          supabase.from('companies').select('*').order('createdAt', { ascending: false }).limit(100),
          supabase.from('contacts').select('*').limit(200),
          supabase.from('deals').select('*'),
          supabase.from('tasks').select('*').order('dueDate', { ascending: true })
        ]);

        if (isMounted) {
          setCompanies(compRes.data && compRes.data.length > 0 ? compRes.data : INITIAL_COMPANIES);
          setContacts(contRes.data && contRes.data.length > 0 ? contRes.data : INITIAL_CONTACTS);
          setDeals(dealRes.data && dealRes.data.length > 0 ? dealRes.data : INITIAL_DEALS);
          setTasks(taskRes.data && taskRes.data.length > 0 ? taskRes.data : INITIAL_TASKS);
        }
      } catch (e) {
        console.error("Data fetch error:", e);
        if (isMounted) {
          setCompanies(INITIAL_COMPANIES);
          setContacts(INITIAL_CONTACTS);
          setDeals(INITIAL_DEALS);
          setTasks(INITIAL_TASKS);
        }
      } finally {
        if (isMounted) setSyncing(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [session]);

  const handleOpenModal = (type: 'company' | 'contact' | 'deal' | 'task', contextId?: string, defaultStage?: string) => {
    const defaultOwner = `${currentUserProfile.firstName} ${currentUserProfile.lastName}`;
    if (type === 'contact') {
      setNewContact({ firstName: '', lastName: '', email: '', phone: '', role: '', owner: defaultOwner, companyId: contextId || '', customValues: {} });
    } else if (type === 'deal') {
      const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
      setNewDeal({ 
        title: '', 
        value: 0, 
        stage: defaultStage || activePipeline.stages[0], 
        expectedCloseDate: '', 
        owner: defaultOwner,
        companyId: contextId || '',
        pipelineId: activePipelineId
      });
    } else if (type === 'task') {
      setNewTask({ title: '', description: '', dueDate: '', priority: 'Medium', relatedId: contextId || '' });
    } else if (type === 'company') {
      setNewCompany({ name: '', industry: '', status: 'Prospect', website: '', owner: defaultOwner, customValues: {} });
      setEditingCompanyId(null);
    }
    setActiveModal(type);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    try {
      if (editingCompanyId) {
        setCompanies(prev => prev.map(c => c.id === editingCompanyId ? { ...c, ...newCompany } : c));
        if (isSupabaseConfigured && supabase) await supabase.from('companies').update(newCompany).eq('id', editingCompanyId);
      } else {
        const data: Company = { id: crypto.randomUUID(), ...newCompany, createdAt: new Date().toISOString() };
        setCompanies(prev => [data, ...prev]);
        if (isSupabaseConfigured && supabase) await supabase.from('companies').insert([data]);
      }
      setActiveModal(null);
    } finally {
      setSyncing(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    const data: Contact = { id: crypto.randomUUID(), ...newContact };
    setContacts(prev => [data, ...prev]);
    if (isSupabaseConfigured && supabase) await supabase.from('contacts').insert([data]);
    setActiveModal(null);
    setSyncing(false);
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    const data: Deal = { id: crypto.randomUUID(), ...newDeal };
    setDeals(prev => [data, ...prev]);
    if (isSupabaseConfigured && supabase) await supabase.from('deals').insert([data]);
    setActiveModal(null);
    setSyncing(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncing(true);
    const data: Task = { id: crypto.randomUUID(), ...newTask, isCompleted: false };
    setTasks(prev => [data, ...prev]);
    if (isSupabaseConfigured && supabase) await supabase.from('tasks').insert([data]);
    setActiveModal(null);
    setSyncing(false);
  };

  const handleMoveDeal = async (dealId: string, newStage: string) => {
    setSyncing(true);
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
    const currentPipeline = pipelines.find(p => p.id === deal.pipelineId) || pipelines[0];
    const automatedTemplates = currentPipeline.automation?.[newStage];
    
    if (automatedTemplates && automatedTemplates.length > 0) {
      const newAutoTasks: Task[] = automatedTemplates.map(tpl => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + tpl.daysOffset);
        return {
          id: crypto.randomUUID(),
          relatedId: deal.companyId,
          title: tpl.title.replace('{deal}', deal.title),
          description: `Zadanie automatyczne dla etapu: ${newStage}`,
          dueDate: dueDate.toISOString().split('T')[0],
          isCompleted: false,
          priority: tpl.priority
        };
      });
      setTasks(prev => [...newAutoTasks, ...prev]);
      if (isSupabaseConfigured && supabase) await supabase.from('tasks').insert(newAutoTasks);
    }

    if (isSupabaseConfigured && supabase) await supabase.from('deals').update({ stage: newStage }).eq('id', dealId);
    setTimeout(() => setSyncing(false), 200);
  };

  const toggleTask = async (taskId: string) => {
    setSyncing(true);
    const taskToToggle = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t));
    if (isSupabaseConfigured && supabase) await supabase.from('tasks').update({ isCompleted: !taskToToggle?.isCompleted }).eq('id', taskId);
    setTimeout(() => setSyncing(false), 200);
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setCurrentUserProfile(profile);
    // Aktualizujemy też w zespole jeśli tam jest
    setTeam(prev => prev.map(u => u.id === profile.id ? profile : u));
  };

  const handleAddTeamMember = (user: UserProfile) => {
    setTeam(prev => [...prev, user]);
  };

  // Fix: Derive selectedCompany from companies list using selectedCompanyId to resolve reference errors
  const selectedCompany = useMemo(() => 
    companies.find(c => c.id === selectedCompanyId), 
    [companies, selectedCompanyId]
  );

  const stats = useMemo(() => ({
    total: deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0),
    tasks: tasks.filter(t => !t.isCompleted).length
  }), [deals, tasks]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(co => `${co.firstName} ${co.lastName} ${co.email} ${co.owner}`.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const q = searchQuery.toLowerCase();
    return companies.filter(c => `${c.name} ${c.industry} ${c.status} ${c.owner}`.toLowerCase().includes(q));
  }, [companies, searchQuery]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Wczytywanie ModernCRM...</p>
      </div>
    </div>
  );

  if (!session) return <AuthView />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} userEmail={session.user.email} />
      <main className={`flex-1 ml-64 p-10 transition-all ${currentView === 'kanban' ? 'max-w-none w-full' : 'max-w-7xl mx-auto'}`}>
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{currentView === 'kanban' ? 'Lejek Sprzedażowy' : currentView}</h1>
          <div className="flex items-center space-x-4">
            {currentView === 'kanban' && (
              <button 
                onClick={() => handleOpenModal('deal')}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                + Dodaj szansę
              </button>
            )}
            <NotificationCenter tasks={tasks} />
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black">
                {currentUserProfile.firstName[0]}
              </div>
              <span className="text-xs font-bold text-slate-700">{currentUserProfile.firstName} {currentUserProfile.lastName}</span>
            </div>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Suma Pipeline</p>
              <h3 className="text-4xl font-black">{(stats.total / 1000).toFixed(0)}k <span className="text-lg">PLN</span></h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Zadania</p>
              <h3 className="text-4xl font-black">{stats.tasks} <span className="text-lg">aktywne</span></h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Baza Firm</p>
              <h3 className="text-4xl font-black">{companies.length} <span className="text-lg">rekordów</span></h3>
            </div>
          </div>
        )}

        {currentView === 'kanban' && (
          <div className="animate-in fade-in duration-500 h-[calc(100vh-180px)]">
            <KanbanBoard 
              deals={deals} 
              companies={companies} 
              pipelines={pipelines} 
              activePipelineId={activePipelineId} 
              onPipelineChange={setActivePipelineId} 
              onMoveDeal={handleMoveDeal} 
              onQuickAddDeal={(stage) => handleOpenModal('deal', undefined, stage)}
            />
          </div>
        )}

        {currentView === 'companies' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <input type="text" placeholder="Szukaj firmy (nazwa, branża, właściciel)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-slate-100 rounded-2xl py-3 px-4 w-80 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm" />
              <button onClick={() => handleOpenModal('company')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj firmę</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr><th className="px-8 py-4">Firma</th><th className="px-8 py-4">Status</th><th className="px-8 py-4">Właściciel</th><th className="px-8 py-4">Data dodania</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredCompanies.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 cursor-pointer group" onClick={() => setSelectedCompanyId(c.id)}>
                      <td className="px-8 py-5 font-bold group-hover:text-indigo-600 transition-colors">{c.name}</td>
                      <td className="px-8 py-5">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'Active' ? 'bg-green-50 text-green-600' : c.status === 'Prospect' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>{c.status}</span>
                      </td>
                      <td className="px-8 py-5 text-slate-500">{c.owner}</td>
                      <td className="px-8 py-5 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
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
              <input type="text" placeholder="Szukaj kontaktu (imię, e-mail, właściciel)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-slate-100 rounded-2xl py-3 px-4 w-96 text-sm font-medium focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm" />
              <button onClick={() => handleOpenModal('contact')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj kontakt</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr><th className="px-8 py-4">Imię i Nazwisko</th><th className="px-8 py-4">Firma</th><th className="px-8 py-4">Właściciel</th><th className="px-8 py-4">Stanowisko</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredContacts.map(co => (
                    <tr key={co.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5 font-bold">{co.firstName} {co.lastName}</td>
                      <td className="px-8 py-5 text-slate-500">{companies.find(c => c.id === co.companyId)?.name || 'Brak'}</td>
                      <td className="px-8 py-5 text-slate-500">{co.owner}</td>
                      <td className="px-8 py-5 text-slate-400">{co.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'tasks' && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Moje Zadania</h2>
              <button onClick={() => handleOpenModal('task')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">+ Dodaj zadanie</button>
            </div>
            {tasks.map(t => (
              <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-all">
                <div className="flex items-center space-x-4">
                  <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-full border-2 transition-all ${t.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-400'}`}>{t.isCompleted && '✓'}</button>
                  <span className={`font-bold transition-all ${t.isCompleted ? 'line-through text-slate-300' : 'text-slate-800'}`}>{t.title}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${t.priority === 'High' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>{t.priority}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {currentView === 'reports' && <ReportsView deals={deals} companies={companies} pipelines={pipelines} />}
        
        {currentView === 'settings' && (
          <SettingsView 
            pipelines={pipelines} 
            customFields={customFields} 
            currentUserProfile={currentUserProfile}
            team={team}
            onUpdateProfile={handleUpdateProfile}
            onAddTeamMember={handleAddTeamMember}
            onAddPipeline={(p) => setPipelines([...pipelines, p])} 
            onAddField={(f) => setCustomFields([...customFields, f])} 
            onReorderField={(idx, dir) => {
              const newFields = [...customFields];
              const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
              if (targetIdx >= 0 && targetIdx < newFields.length) {
                [newFields[idx], newFields[targetIdx]] = [newFields[targetIdx], newFields[idx]];
                setCustomFields(newFields);
              }
            }} 
            onMoveStage={(pid, s, d) => setPipelines(prev => prev.map(p => {
              if (p.id !== pid) return p;
              const newStages = [...p.stages];
              const [removed] = newStages.splice(s, 1);
              newStages.splice(d, 0, removed);
              return { ...p, stages: newStages };
            }))}
            onAddStage={(pid, name) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, stages: [...p.stages, name] } : p))}
            onEditStage={(pid, old, next) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, stages: p.stages.map(s => s === old ? next : s) } : p))}
            onRemoveStage={(pid, name) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, stages: p.stages.filter(s => s !== name) } : p))}
            onRemoveField={(fid) => setCustomFields(prev => prev.filter(f => f.id !== fid))}
            onRemovePipeline={(pid) => setPipelines(prev => prev.filter(p => p.id !== pid))}
            onUpdateAutomation={(pid, s, t) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, automation: { ...(p.automation || {}), [s]: t } } : p))}
          />
        )}
      </main>

      {selectedCompany && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40" onClick={() => setSelectedCompanyId(null)} />
          <CompanyDetailPanel 
            company={selectedCompany} 
            deals={deals.filter(d => d.companyId === selectedCompanyId)} 
            contacts={contacts.filter(co => co.companyId === selectedCompanyId)} 
            tasks={tasks.filter(t => t.relatedId === selectedCompanyId)} 
            onClose={() => setSelectedCompanyId(null)} 
            onEdit={() => { 
              if (selectedCompany) {
                setNewCompany({ ...selectedCompany, customValues: selectedCompany.customValues || {} }); 
                setEditingCompanyId(selectedCompany.id); 
                setActiveModal('company'); 
              }
            }} 
            onAddContact={() => handleOpenModal('contact', selectedCompanyId!)} 
            onAddDeal={() => handleOpenModal('deal', selectedCompanyId!)} 
            onAddTask={() => handleOpenModal('task', selectedCompanyId!)} 
            customFields={customFields} 
          />
        </>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{activeModal === 'company' ? 'Dane Firmy' : activeModal === 'contact' ? 'Nowy Kontakt' : activeModal === 'deal' ? 'Nowa Szansa' : 'Nowe Zadanie'}</h3>
             <form onSubmit={activeModal === 'company' ? handleSaveCompany : activeModal === 'contact' ? handleAddContact : activeModal === 'deal' ? handleAddDeal : handleAddTask} className="space-y-4">
                {activeModal === 'company' && (
                  <>
                    <input required type="text" placeholder="Nazwa Firmy" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <select required value={newCompany.owner} onChange={e => setNewCompany({...newCompany, owner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {team.map(u => <option key={u.id} value={`${u.firstName} ${u.lastName}`}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <select value={newCompany.status} onChange={e => setNewCompany({...newCompany, status: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      <option value="Prospect">Prospect</option><option value="Active">Aktywny Klient</option><option value="Inactive">Nieaktywny</option>
                    </select>
                  </>
                )}
                {activeModal === 'contact' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="Imię" value={newContact.firstName} onChange={e => setNewContact({...newContact, firstName: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                      <input required type="text" placeholder="Nazwisko" value={newContact.lastName} onChange={e => setNewContact({...newContact, lastName: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <select required value={newContact.owner} onChange={e => setNewContact({...newContact, owner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {team.map(u => <option key={u.id} value={`${u.firstName} ${u.lastName}`}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <select required value={newContact.companyId} onChange={e => setNewContact({...newContact, companyId: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      <option value="">Wybierz firmę...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </>
                )}
                {activeModal === 'deal' && (
                  <>
                    <input required type="text" placeholder="Tytuł szansy" value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <input required type="number" placeholder="Wartość PLN" value={newDeal.value || ''} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <select required value={newDeal.owner} onChange={e => setNewDeal({...newDeal, owner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {team.map(u => <option key={u.id} value={`${u.firstName} ${u.lastName}`}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <select required value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {pipelines.find(p => p.id === activePipelineId)?.stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                <div className="flex gap-4 pt-6">
                  <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">Zapisz</button>
                  <button type="button" onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Anuluj</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {syncing && (
        <div className="fixed bottom-10 right-10 flex items-center space-x-3 bg-slate-900 text-white px-5 py-3 rounded-2xl text-[10px] font-black shadow-2xl animate-in slide-in-from-bottom-5 duration-300 z-50 uppercase tracking-widest">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          <span>Synchronizacja danych...</span>
        </div>
      )}
    </div>
  );
};

export default App;
