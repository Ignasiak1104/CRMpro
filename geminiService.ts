
import { GoogleGenAI } from "@google/genai";
import { Company, Deal, Contact, Task } from './types';

export const getCRMInsights = async (
  company: Company,
  deals: Deal[],
  contacts: Contact[],
  tasks: Task[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const context = `
    Firma: ${company.name} (${company.industry})
    Szanse: ${deals.map(d => `${d.title} (${d.value} PLN)`).join(', ')}
    Zadania: ${tasks.map(t => `${t.title} (${t.isCompleted ? 'done' : 'todo'})`).join(', ')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Przeanalizuj status klienta i daj 2 konkretne rady sprzedażowe (max 3 zdania): ${context}`,
      config: { temperature: 0.7 }
    });
    return response.text || "Brak analizy.";
  } catch (e) {
    return "Analiza AI niedostępna.";
  }
};
