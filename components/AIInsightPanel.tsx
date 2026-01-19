
import React, { useState } from 'react';
import { Company, Deal, Contact, Task } from '../types';
import { getCRMInsights } from '../geminiService';

interface AIInsightPanelProps {
  company: Company;
  deals: Deal[];
  contacts: Contact[];
  tasks: Task[];
}

const AIInsightPanel: React.FC<AIInsightPanelProps> = ({ company, deals, contacts, tasks }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    const result = await getCRMInsights(company, deals, contacts, tasks);
    setInsight(result);
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden mt-8">
      <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl pointer-events-none">✨</div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-1">Rekomendacja Gemini AI</h3>
            <p className="text-slate-400 text-sm">Podsumowanie dla {company.name}</p>
          </div>
          <button 
            onClick={generateInsight}
            disabled={loading}
            className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-sm font-black hover:bg-indigo-50 transition-all disabled:opacity-50"
          >
            {loading ? 'Analizuję...' : 'Pytaj AI'}
          </button>
        </div>
        <div className="min-h-[60px] flex items-center">
          {insight ? (
            <p className="text-slate-200 text-lg leading-relaxed font-medium animate-in fade-in duration-700">"{insight}"</p>
          ) : (
            <p className="text-slate-500 italic">Kliknij przycisk powyżej, aby wygenerować analizę tej firmy.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightPanel;
