
export enum Stage {
  NEW = 'Nowy',
  QUALIFIED = 'Kwalifikacja',
  PROPOSAL = 'Propozycja',
  NEGOTIATION = 'Negocjacje',
  WON = 'Pozyskany',
  LOST = 'Utracony'
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'User' | 'Manager';
}

export interface AutomatedTaskTemplate {
  id: string;
  title: string;
  daysOffset: number;
  priority: 'Low' | 'Medium' | 'High';
}

export interface Pipeline {
  id: string;
  name: string;
  stages: string[];
  automation?: Record<string, AutomatedTaskTemplate[]>;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  target: 'company' | 'contact';
  options?: string[];
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website: string;
  status: 'Active' | 'Prospect' | 'Inactive';
  createdAt: string;
  owner: string;
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
  owner: string;
  customValues?: Record<string, any>;
}

export interface Deal {
  id: string;
  companyId: string;
  pipelineId: string;
  title: string;
  value: number;
  stage: string;
  expectedCloseDate: string;
  owner: string;
}

export interface Task {
  id: string;
  relatedId: string;
  relatedType?: 'company' | 'contact' | 'deal' | 'none';
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export type ViewType = 'dashboard' | 'companies' | 'contacts' | 'kanban' | 'tasks' | 'reports' | 'settings';
