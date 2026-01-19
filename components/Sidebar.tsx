
import React from 'react';
import { ViewType } from '../types';
import { supabase } from '../supabaseClient';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, userEmail }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'companies', label: 'Firmy', icon: '💼' },
    { id: 'contacts', label: 'Kontakty', icon: '👤' },
    { id: 'kanban', label: 'Sprzedaż', icon: '📈' },
    { id: 'tasks', label: 'Zadania', icon: '✔️' },
    { id: 'reports', label: 'Raporty', icon: '📊' },
    { id: 'settings', label: 'Ustawienia', icon: '⚙️' },
  ];

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 h-screen fixed left-0 top-0 flex flex-col z-20 shadow-sm">
      <div className="p-8 flex items-center space-x-3">
        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 animate-in zoom-in duration-500">M</div>
        <span className="text-xl font-black text-slate-900 tracking-tighter">ModernCRM</span>
      </div>
      
      <nav className="flex-1 px-4 mt-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewType)}
              className={`group relative w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-300 ease-out overflow-hidden ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:translate-x-1'
              }`}
            >
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 bg-indigo-600 rounded-r-full transition-all duration-300 ease-in-out ${
                isActive ? 'h-6 opacity-100' : 'h-0 opacity-0'
              }`} />

              <span className={`mr-3 text-lg transition-all duration-500 ${
                isActive ? 'scale-125 rotate-3' : 'group-hover:scale-110 group-active:scale-95'
              }`}>
                {item.icon}
              </span>
              
              <span className={`transition-all duration-300 ${isActive ? 'translate-x-0.5' : ''}`}>
                {item.label}
              </span>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 space-y-4">
        {userEmail && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Zalogowany jako</p>
            <p className="text-[11px] font-bold text-slate-700 truncate">{userEmail}</p>
            <button 
              onClick={handleLogout}
              className="mt-3 w-full py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
