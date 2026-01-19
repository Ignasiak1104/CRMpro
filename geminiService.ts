
import { GoogleGenAI } from "@google/genai";
import { Company, Deal, Contact, Task } from './types';

export const getCRMInsights = async (
  company: Company,
  deals: Deal[],
  contacts: Contact[],
  tasks: Task[]
): Promise<string> => {
  // Bezpieczny dostęp do klucza wstrzykiwanego przez środowisko
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) 
    ? process.env.API_KEY 
    : (window as any).API_KEY;

  if (!apiKey) return "Brak klucza API Gemini.";

  const ai = new GoogleGenAI({ apiKey });
  
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
    console.error("Gemini Error:", e);
    return "Analiza AI niedostępna.";
  }
};
