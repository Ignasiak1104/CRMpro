
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
import { Company, Contact, Deal, Task, ViewType, Stage, Pipeline, CustomField, UserProfile } from './types';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile>({
    id: 'u-init', email: '', firstName: 'Użytkownik', lastName: 'CRM', role: 'Admin'
  });

  const [pipelines, setPipelines] = useState<Pipeline[]>([
    { id: 'p1', name: 'Sprzedaż standardowa', stages: Object.values(Stage), automation: {} }
  ]);
  const [activePipelineId, setActivePipelineId] = useState<string>('p1');

  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'company' | 'contact' | 'deal' | 'task' | null>(null);

  const [newCompany, setNewCompany] = useState({ name: '', industry: '', status: 'Prospect' as Company['status'], website: '', owner: '', customValues: {} as Record<string, any> });
  const [newContact, setNewContact] = useState({ firstName: '', lastName: '', email: '', phone: '', role: '', owner: '', companyId: '', customValues: {} as Record<string, any> });
  const [newDeal, setNewDeal] = useState({ title: '', value: 0, stage: '', expectedCloseDate: '', owner: '', companyId: '', pipelineId: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', dueDate: '', priority: 'Medium' as Task['priority'], relatedId: '', relatedType: 'none' as Task['relatedType'] });

  useEffect(() => {
    let authSubscription: any = null;
    const initAuth = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setSession({ user: { email: 'demo@moderncrm.pro', id: 'demo-id' } });
        setLoading(false);
        return;
      }
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
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
    const fetchUserData = async () => {
      if (session?.user && isSupabaseConfigured && supabase) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (profile) {
          setCurrentUserProfile({
            id: profile.id,
            email: profile.email,
            firstName: profile.first_name || profile.email.split('@')[0],
            lastName: profile.last_name || '',
            role: profile.role
          });
        }
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles) {
          setTeam(profiles.map(p => ({
            id: p.id,
            email: p.email,
            firstName: p.first_name || p.email.split('@')[0],
            lastName: p.last_name || '',
            role: p.role
          })));
        }
      }
    };
    fetchUserData();
  }, [session]);

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
          supabase.from('companies').select('*').order('createdAt', { ascending: false }),
          supabase.from('contacts').select('*'),
          supabase.from('deals').select('*'),
          supabase.from('tasks').select('*').order('dueDate', { ascending: true })
        ]);
        if (isMounted) {
          setCompanies(compRes.data || []);
          setContacts(contRes.data || []);
          setDeals(dealRes.data || []);
          setTasks(taskRes.data || []);
        }
      } catch (e) {
        console.error("Data fetch error:", e);
      } finally {
        if (isMounted) setSyncing(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [session]);

  const handleOpenModal = (type: 'company' | 'contact' | 'deal' | 'task', contextId?: string, defaultStage?: string) => {
    const defaultOwner = `${currentUserProfile.firstName} ${currentUserProfile.lastName}`.trim();
    if (type === 'contact') {
      setNewContact({ firstName: '', lastName: '', email: '', phone: '', role: '', owner: defaultOwner, companyId: contextId || '', customValues: {} });
    } else if (type === 'deal') {
      const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];
      setNewDeal({ title: '', value: 0, stage: defaultStage || activePipeline.stages[0], expectedCloseDate: '', owner: defaultOwner, companyId: contextId || '', pipelineId: activePipelineId });
    } else if (type === 'task') {
      setNewTask({ 
        title: '', 
        description: '', 
        dueDate: new Date().toISOString().split('T')[0], 
        priority: 'Medium', 
        relatedId: contextId || '', 
        relatedType: contextId ? 'company' : 'none' 
      });
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
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
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

  const handleUpdateProfile = async (profile: UserProfile) => {
    setCurrentUserProfile(profile);
    setTeam(prev => prev.map(u => u.id === profile.id ? profile : u));
    if (isSupabaseConfigured && supabase) {
      await supabase.from('profiles').update({ first_name: profile.firstName, last_name: profile.lastName, role: profile.role }).eq('id', profile.id);
    }
  };

  const handleAddTeamMember = (user: UserProfile) => {
    setTeam(prev => [...prev, user]);
  };

  const selectedCompany = useMemo(() => companies.find(c => c.id === selectedCompanyId), [companies, selectedCompanyId]);
  const stats = useMemo(() => ({ total: deals.reduce((acc, d) => acc + (Number(d.value) || 0), 0), tasks: tasks.filter(t => !t.isCompleted).length }), [deals, tasks]);
  const filteredContacts = useMemo(() => searchQuery ? contacts.filter(co => `${co.firstName} ${co.lastName} ${co.email} ${co.owner}`.toLowerCase().includes(searchQuery.toLowerCase())) : contacts, [contacts, searchQuery]);
  const filteredCompanies = useMemo(() => searchQuery ? companies.filter(c => `${c.name} ${c.industry} ${c.status} ${c.owner}`.toLowerCase().includes(searchQuery.toLowerCase())) : companies, [companies, searchQuery]);
  const availableOwners = useMemo(() => team.length > 0 ? team : [currentUserProfile], [team, currentUserProfile]);

  const companyCustomFields = useMemo(() => customFields.filter(f => f.target === 'company'), [customFields]);
  const contactCustomFields = useMemo(() => customFields.filter(f => f.target === 'contact'), [customFields]);

  const getTaskRelationLabel = (task: Task) => {
    if (!task.relatedId || task.relatedType === 'none') return null;
    if (task.relatedType === 'company') return companies.find(c => c.id === task.relatedId)?.name;
    if (task.relatedType === 'contact') {
      const contact = contacts.find(c => c.id === task.relatedId);
      return contact ? `${contact.firstName} ${contact.lastName}` : null;
    }
    if (task.relatedType === 'deal') return deals.find(d => d.id === task.relatedId)?.title;
    return null;
  };

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
      <Sidebar currentView={currentView} onViewChange={setCurrentView} userEmail={currentUserProfile.email} userName={`${currentUserProfile.firstName} ${currentUserProfile.lastName}`.trim()} />
      <main className={`flex-1 ml-64 p-10 transition-all ${currentView === 'kanban' ? 'max-w-none w-full' : 'max-w-7xl mx-auto'}`}>
        <header className="mb-10 flex justify-between items-center">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{currentView === 'kanban' ? 'Lejek Sprzedażowy' : currentView}</h1>
          <div className="flex items-center space-x-4">
            {currentView === 'kanban' && <button onClick={() => handleOpenModal('deal')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">+ Dodaj szansę</button>}
            <NotificationCenter tasks={tasks} />
            <div className="flex items-center space-x-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-black">{currentUserProfile.firstName[0]}</div>
              <span className="text-xs font-bold text-slate-700">{currentUserProfile.firstName} {currentUserProfile.lastName}</span>
            </div>
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Suma Pipeline</p>
              <h3 className="text-4xl font-black">{(stats.total / 1000).toFixed(0)}k <span className="text-lg">PLN</span></h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Zadania</p>
              <h3 className="text-4xl font-black">{stats.tasks} <span className="text-lg">aktywne</span></h3>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Baza Firm</p>
              <h3 className="text-4xl font-black">{companies.length} <span className="text-lg">rekordów</span></h3>
            </div>
          </div>
        )}

        {currentView === 'kanban' && <div className="animate-in fade-in duration-500 h-[calc(100vh-180px)]"><KanbanBoard deals={deals} companies={companies} pipelines={pipelines} activePipelineId={activePipelineId} onPipelineChange={setActivePipelineId} onMoveDeal={handleMoveDeal} onQuickAddDeal={(stage) => handleOpenModal('deal', undefined, stage)} /></div>}

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
                      <td className="px-8 py-5"><span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${c.status === 'Active' ? 'bg-green-50 text-green-600' : c.status === 'Prospect' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>{c.status}</span></td>
                      <td className="px-8 py-5 text-slate-500">{c.owner}</td>
                      <td className="px-8 py-5 text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {filteredCompanies.length === 0 && <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">Brak zarejestrowanych firm.</td></tr>}
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
                  {filteredContacts.length === 0 && <tr><td colSpan={4} className="px-8 py-10 text-center text-slate-400 italic">Brak zarejestrowanych kontaktów.</td></tr>}
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
            {tasks.map(t => {
              const relation = getTaskRelationLabel(t);
              return (
                <div key={t.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm hover:border-indigo-100 transition-all group">
                  <div className="flex items-center space-x-4">
                    <button onClick={() => toggleTask(t.id)} className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${t.isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 hover:border-indigo-400'}`}>
                      {t.isCompleted && <span className="text-[10px]">✓</span>}
                    </button>
                    <div>
                      <span className={`font-bold block transition-all ${t.isCompleted ? 'line-through text-slate-300' : 'text-slate-800'}`}>{t.title}</span>
                      {relation && (
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-0.5 block">
                          🔗 Powiązane z: {relation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${t.priority === 'High' ? 'bg-rose-50 text-rose-500' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'}`}>
                      {t.priority}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{t.dueDate}</span>
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && <div className="p-20 text-center bg-white rounded-3xl border border-slate-100 text-slate-400 italic font-medium">Brak aktywnych zadań. Kliknij przycisk powyżej, aby dodać pierwsze!</div>}
          </div>
        )}

        {currentView === 'reports' && <ReportsView deals={deals} companies={companies} pipelines={pipelines} />}
        {currentView === 'settings' && <SettingsView pipelines={pipelines} customFields={customFields} currentUserProfile={currentUserProfile} team={team} onUpdateProfile={handleUpdateProfile} onAddTeamMember={handleAddTeamMember} onAddPipeline={(p) => setPipelines([...pipelines, p])} onAddField={(f) => setCustomFields([...customFields, f])} onReorderField={(idx, dir) => { const newFields = [...customFields]; const targetIdx = dir === 'up' ? idx - 1 : idx + 1; if (targetIdx >= 0 && targetIdx < newFields.length) { [newFields[idx], newFields[targetIdx]] = [newFields[targetIdx], newFields[idx]]; setCustomFields(newFields); } }} onMoveStage={(pid, s, d) => setPipelines(prev => prev.map(p => { if (p.id !== pid) return p; const newStages = [...p.stages]; const [removed] = newStages.splice(s, 1); newStages.splice(d, 0, removed); return { ...p, stages: newStages }; }))} onAddStage={(pid, name) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, stages: [...p.stages, name] } : p))} onEditStage={(pid, old, next) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, stages: p.stages.map(s => s === old ? next : s) } : p))} onRemoveStage={(pid, name) => setPipelines(prev => prev.map(p => p.id === pid ? { ...p, stages: p.stages.filter(s => s !== name) } : p))} onRemoveField={(fid) => setCustomFields(prev => prev.filter(f => f.id !== fid))} onRemovePipeline={(pid) => setPipelines(prev => prev.filter(p => p.id !== pid))} onUpdateAutomation={(pid, s, t) => {}} />}
      </main>

      {selectedCompany && (
        <>
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40" onClick={() => setSelectedCompanyId(null)} />
          <CompanyDetailPanel company={selectedCompany} deals={deals.filter(d => d.companyId === selectedCompanyId)} contacts={contacts.filter(co => co.companyId === selectedCompanyId)} tasks={tasks.filter(t => t.relatedId === selectedCompanyId)} onClose={() => setSelectedCompanyId(null)} onEdit={() => { if (selectedCompany) { setNewCompany({ ...selectedCompany, customValues: selectedCompany.customValues || {} }); setEditingCompanyId(selectedCompany.id); setActiveModal('company'); } }} onAddContact={() => handleOpenModal('contact', selectedCompanyId!)} onAddDeal={() => handleOpenModal('deal', selectedCompanyId!)} onAddTask={() => handleOpenModal('task', selectedCompanyId!)} customFields={customFields} />
        </>
      )}

      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
               {activeModal === 'company' ? 'Dane Firmy' : activeModal === 'contact' ? 'Nowy Kontakt' : activeModal === 'deal' ? 'Nowa Szansa' : 'Nowe Zadanie'}
             </h3>
             <form onSubmit={activeModal === 'company' ? handleSaveCompany : activeModal === 'contact' ? handleAddContact : activeModal === 'deal' ? handleAddDeal : handleAddTask} className="space-y-4">
                {activeModal === 'company' && (
                  <>
                    <input required type="text" placeholder="Nazwa Firmy" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <select required value={newCompany.owner} onChange={e => setNewCompany({...newCompany, owner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {availableOwners.map(u => <option key={u.id} value={`${u.firstName} ${u.lastName}`.trim()}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <select value={newCompany.status} onChange={e => setNewCompany({...newCompany, status: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      <option value="Prospect">Prospect</option><option value="Active">Aktywny Klient</option><option value="Inactive">Nieaktywny</option>
                    </select>
                    
                    {companyCustomFields.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pola niestandardowe</p>
                        {companyCustomFields.map(f => (
                          <div key={f.id} className="mb-3">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{f.label}</label>
                            <input 
                              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                              value={newCompany.customValues[f.id] || ''} 
                              onChange={e => setNewCompany({...newCompany, customValues: {...newCompany.customValues, [f.id]: e.target.value}})}
                              className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeModal === 'contact' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input required type="text" placeholder="Imię" value={newContact.firstName} onChange={e => setNewContact({...newContact, firstName: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                      <input required type="text" placeholder="Nazwisko" value={newContact.lastName} onChange={e => setNewContact({...newContact, lastName: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    <select required value={newContact.owner} onChange={e => setNewContact({...newContact, owner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {availableOwners.map(u => <option key={u.id} value={`${u.firstName} ${u.lastName}`.trim()}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <select required value={newContact.companyId} onChange={e => setNewContact({...newContact, companyId: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      <option value="">Wybierz firmę...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    {contactCustomFields.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Pola niestandardowe</p>
                        {contactCustomFields.map(f => (
                          <div key={f.id} className="mb-3">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">{f.label}</label>
                            <input 
                              type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                              value={newContact.customValues[f.id] || ''} 
                              onChange={e => setNewContact({...newContact, customValues: {...newContact.customValues, [f.id]: e.target.value}})}
                              className="w-full bg-slate-50 border-none rounded-2xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {activeModal === 'deal' && (
                  <>
                    <input required type="text" placeholder="Tytuł szansy" value={newDeal.title} onChange={e => setNewDeal({...newDeal, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <input required type="number" placeholder="Wartość PLN" value={newDeal.value || ''} onChange={e => setNewDeal({...newDeal, value: Number(e.target.value)})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <select required value={newDeal.owner} onChange={e => setNewDeal({...newDeal, owner: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {availableOwners.map(u => <option key={u.id} value={`${u.firstName} ${u.lastName}`.trim()}>{u.firstName} {u.lastName}</option>)}
                    </select>
                    <select required value={newDeal.stage} onChange={e => setNewDeal({...newDeal, stage: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                      {pipelines.find(p => p.id === activePipelineId)?.stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </>
                )}
                {activeModal === 'task' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nazwa zadania</label>
                      <input required type="text" placeholder="Co jest do zrobienia?" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Termin</label>
                        <input required type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Priorytet</label>
                        <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value as any})} className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none">
                          <option value="Low">Niski</option>
                          <option value="Medium">Średni</option>
                          <option value="High">Wysoki</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Powiązanie</p>
                      <div className="space-y-3">
                        <select 
                          value={newTask.relatedType} 
                          onChange={e => setNewTask({...newTask, relatedType: e.target.value as any, relatedId: ''})} 
                          className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none"
                        >
                          <option value="none">Brak powiązania</option>
                          <option value="company">Firma</option>
                          <option value="contact">Kontakt</option>
                          <option value="deal">Szansa sprzedaży</option>
                        </select>

                        {newTask.relatedType !== 'none' && (
                          <select 
                            required 
                            value={newTask.relatedId} 
                            onChange={e => setNewTask({...newTask, relatedId: e.target.value})} 
                            className="w-full bg-white border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none animate-in fade-in slide-in-from-top-1"
                          >
                            <option value="">Wybierz element...</option>
                            {newTask.relatedType === 'company' && companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            {newTask.relatedType === 'contact' && contacts.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
                            {newTask.relatedType === 'deal' && deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                          </select>
                        )}
                      </div>
                    </div>
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
