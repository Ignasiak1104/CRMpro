
import React, { useState, useMemo } from 'react';
import { Task } from '../types';

interface NotificationCenterProps {
  tasks: Task[];
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ tasks }) => {
  const [isOpen, setIsOpen] = useState(false);

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return tasks
      .filter(t => !t.isCompleted)
      .map(t => {
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        let status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' = 'upcoming';
        if (dueDate < today) status = 'overdue';
        else if (dueDate.getTime() === today.getTime()) status = 'today';
        else if (dueDate.getTime() === tomorrow.getTime()) status = 'tomorrow';

        return { ...t, status };
      })
      .filter(t => t.status !== 'upcoming' || (new Date(t.dueDate).getTime() - today.getTime()) < 3 * 24 * 60 * 60 * 1000)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks]);

  const urgentCount = notifications.filter(n => n.status === 'overdue' || n.status === 'today').length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:bg-slate-50 transition-all group"
      >
        <span className="text-xl group-hover:scale-110 transition-transform block">🔔</span>
        {urgentCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-bounce">
            {urgentCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-4 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-sm tracking-tight">Powiadomienia</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{notifications.length} aktywnych</span>
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map(n => (
                    <div key={n.id} className="p-5 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          n.status === 'overdue' ? 'bg-rose-50 text-rose-600' :
                          n.status === 'today' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {n.status === 'overdue' ? 'Zaległe' : n.status === 'today' ? 'Dzisiaj' : n.status === 'tomorrow' ? 'Jutro' : 'Wkrótce'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-slate-400">{n.dueDate}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 leading-snug">{n.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{n.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <span className="text-4xl block mb-4 opacity-20">🎉</span>
                  <p className="text-sm font-bold text-slate-800">Wszystko gotowe!</p>
                  <p className="text-xs text-slate-400 mt-1">Nie masz pilnych zadań.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-50 text-center">
              <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">
                Zobacz wszystkie zadania
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
