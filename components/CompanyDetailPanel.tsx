
import React from 'react';
import { Company, Deal, Contact, Task } from '../types';
import AIInsightPanel from './AIInsightPanel';

interface CompanyDetailPanelProps {
  company: Company;
  deals: Deal[];
  contacts: Contact[];
  tasks: Task[];
  onClose: () => void;
  onEdit: () => void;
  onAddTask: () => void;
}

const CompanyDetailPanel: React.FC<CompanyDetailPanelProps> = ({ company, deals, contacts, tasks, onClose, onEdit, onAddTask }) => {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-8 border-b border-slate-50 flex justify-between items-start bg-slate-50/50">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
              {company.name[0]}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{company.name}</h2>
              <p className="text-slate-400 text-sm font-medium">{company.website}</p>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {company.industry}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              company.status === 'Active' ? 'bg-green-50 text-green-600' : 
              company.status === 'Prospect' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
            }`}>
              {company.status}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 font-bold"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {/* AI Analysis Section */}
        <section>
          <AIInsightPanel 
            company={company} 
            deals={deals} 
            contacts={contacts} 
            tasks={tasks} 
          />
        </section>

        {/* Contacts Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kontakty ({contacts.length})</h3>
          </div>
          <div className="space-y-3">
            {contacts.length > 0 ? contacts.map(contact => (
              <div key={contact.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{contact.firstName} {contact.lastName}</p>
                  <p className="text-xs text-slate-400">{contact.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-600">{contact.email}</p>
                  <p className="text-[10px] text-slate-400">{contact.phone}</p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic">Brak przypisanych kontaktów.</p>
            )}
          </div>
        </section>

        {/* Deals Section */}
        <section>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Szanse Sprzedażowe ({deals.length})</h3>
          <div className="space-y-3">
            {deals.length > 0 ? deals.map(deal => (
              <div key={deal.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors cursor-pointer">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{deal.title}</p>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">{deal.stage}</p>
                </div>
                <p className="font-black text-slate-900">{deal.value.toLocaleString()} PLN</p>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic">Brak aktywnych szans.</p>
            )}
          </div>
        </section>

        {/* Tasks Section */}
        <section>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Powiązane Zadania</h3>
          <div className="space-y-2">
            {tasks.length > 0 ? tasks.map(task => (
              <div key={task.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className={`w-2 h-2 rounded-full ${task.isCompleted ? 'bg-slate-300' : 'bg-indigo-600 animate-pulse'}`}></div>
                <p className={`text-sm font-medium ${task.isCompleted ? 'line-through text-slate-300' : 'text-slate-700'}`}>
                  {task.title}
                </p>
                <span className="ml-auto text-[10px] text-slate-400 font-bold">{task.dueDate}</span>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic">Brak zadań.</p>
            )}
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex space-x-4">
        <button 
          onClick={onEdit}
          className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
        >
          Edytuj Dane
        </button>
        <button 
          onClick={onAddTask}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          Nowe Zadanie
        </button>
      </div>
    </div>
  );
};

export default CompanyDetailPanel;
