
export enum Stage {
  NEW = 'Nowy',
  QUALIFIED = 'Kwalifikacja',
  PROPOSAL = 'Propozycja',
  NEGOTIATION = 'Negocjacje',
  WON = 'Pozyskany',
  LOST = 'Utracony'
}

export interface Pipeline {
  id: string;
  name: string;
  stages: string[];
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  target: 'company' | 'contact';
  options?: string[]; // Opcje dla typu 'select'
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  status: 'Active' | 'Prospect' | 'Inactive';
  createdAt: string;
  customValues?: Record<string, any>;
}

export interface Contact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  customValues?: Record<string, any>;
}

export interface Deal {
  id: string;
  companyId: string;
  title: string;
  value: number;
  stage: Stage;
  expectedCloseDate: string;
}

export interface Task {
  id: string;
  relatedId: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export type ViewType = 'dashboard' | 'companies' | 'contacts' | 'kanban' | 'tasks' | 'reports' | 'settings';
