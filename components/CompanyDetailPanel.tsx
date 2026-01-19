
import React from 'react';
import { Company, Deal, Contact, Task, CustomField } from '../types';
import AIInsightPanel from './AIInsightPanel';

interface CompanyDetailPanelProps {
  company: Company;
  deals: Deal[];
  contacts: Contact[];
  tasks: Task[];
  onClose: () => void;
  onEdit: () => void;
  onAddTask: () => void;
  onAddContact: () => void;
  onAddDeal: () => void;
  customFields: CustomField[];
}

const CompanyDetailPanel: React.FC<CompanyDetailPanelProps> = ({ 
  company, deals, contacts, tasks, onClose, onEdit, onAddTask, onAddContact, onAddDeal, customFields 
}) => {
  const companyCustomFields = customFields.filter(f => f.target === 'company');

  const getContactName = (contactId?: string) => {
    if (!contactId) return null;
    const contact = contacts.find(c => c.id === contactId);
    return contact ? `${contact.firstName} ${contact.lastName}` : null;
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-300">
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
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="px-3 py-1 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{company.industry}</span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${company.status === 'Active' ? 'bg-green-50 text-green-600' : company.status === 'Prospect' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{company.status}</span>
            <span className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">👤 {company.owner}</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400 font-bold">✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        <AIInsightPanel company={company} deals={deals} contacts={contacts} tasks={tasks} />

        {companyCustomFields.length > 0 && (
          <section>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Informacje dodatkowe</h3>
            <div className="grid grid-cols-2 gap-4">
              {companyCustomFields.map(f => {
                const val = company.customValues?.[f.id];
                if (!val) return null;
                return (
                  <div key={f.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{f.label}</p>
                    <p className="text-sm font-bold text-slate-800">{val}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Kontakty ({contacts.length})</h3>
            <button onClick={onAddContact} className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all font-black">+</button>
          </div>
          <div className="space-y-3">
            {contacts.map(contact => (
              <div key={contact.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                <div>
                  <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{contact.firstName} {contact.lastName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Rola: {contact.role || 'Brak'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-600">{contact.email}</p>
                </div>
              </div>
            ))}
            {contacts.length === 0 && <p className="text-xs text-slate-400 italic">Brak osób kontaktowych.</p>}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Szanse Sprzedażowe ({deals.length})</h3>
            <button onClick={onAddDeal} className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all font-black">+</button>
          </div>
          <div className="space-y-3">
            {deals.map(deal => (
              <div key={deal.id} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-colors">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{deal.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{deal.stage}</p>
                    {deal.contactId && (
                      <span className="text-[10px] text-slate-400 font-bold italic">
                        • {getContactName(deal.contactId)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">{deal.value.toLocaleString()} <span className="text-[10px] text-slate-400">PLN</span></p>
                </div>
              </div>
            ))}
            {deals.length === 0 && <p className="text-xs text-slate-400 italic">Brak otwartych transakcji.</p>}
          </div>
        </section>
      </div>

      <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex space-x-4">
        <button onClick={onEdit} className="flex-1 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Edytuj Dane</button>
        <button onClick={onAddTask} className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Nowe Zadanie</button>
      </div>
    </div>
  );
};

export default CompanyDetailPanel;
