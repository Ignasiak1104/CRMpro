
import { Company, Contact, Deal, Stage, Task } from './types';

export const INITIAL_COMPANIES: Company[] = [
  { id: '1', name: 'Tech Solutions Sp. z o.o.', industry: 'IT', website: 'techsolutions.pl', status: 'Active', createdAt: '2023-10-01' },
  { id: '2', name: 'Budopol S.A.', industry: 'Budownictwo', website: 'budopol.com', status: 'Prospect', createdAt: '2023-11-15' },
  { id: '3', name: 'Green Energy Group', industry: 'OZE', website: 'greenenergy.eu', status: 'Active', createdAt: '2023-09-20' },
  { id: '4', name: 'Logistyka 24', industry: 'Logistyka', website: 'l24.pl', status: 'Prospect', createdAt: '2024-01-10' },
];

export const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', companyId: '1', firstName: 'Adam', lastName: 'Nowak', email: 'adam.nowak@techsolutions.pl', phone: '+48 123 456 789', role: 'CTO' },
  { id: 'c2', companyId: '2', firstName: 'Marta', lastName: 'Kowalska', email: 'm.kowalska@budopol.com', phone: '+48 987 654 321', role: 'Project Manager' },
  { id: 'c3', companyId: '3', firstName: 'Jan', lastName: 'Zieliński', email: 'j.zielinski@greenenergy.eu', phone: '+48 555 111 222', role: 'CEO' },
];

export const INITIAL_DEALS: Deal[] = [
  { id: 'd1', companyId: '1', pipelineId: 'p1', title: 'Wdrożenie ERP', value: 150000, stage: 'Negocjacje', expectedCloseDate: '2024-06-30' },
  { id: 'd2', companyId: '2', pipelineId: 'p1', title: 'Zakup licencji cloud', value: 45000, stage: 'Kwalifikacja', expectedCloseDate: '2024-05-15' },
  { id: 'd3', companyId: '3', pipelineId: 'p1', title: 'Audyt infrastruktury', value: 12000, stage: 'Nowy', expectedCloseDate: '2024-04-10' },
  { id: 'd4', companyId: '4', pipelineId: 'p1', title: 'Optymalizacja tras', value: 85000, stage: 'Propozycja', expectedCloseDate: '2024-08-20' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 't1', relatedId: '1', title: 'Telefon do Adama', description: 'Omówienie szczegółów umowy ERP', dueDate: '2024-04-12', isCompleted: false, priority: 'High' },
  { id: 't2', relatedId: '2', title: 'Wysłanie oferty', description: 'Przygotować PDF z ofertą chmurową', dueDate: '2024-04-15', isCompleted: true, priority: 'Medium' },
  { id: 't3', relatedId: '3', title: 'Spotkanie zapoznawcze', description: 'Pierwsza kawa w biurze klienta', dueDate: '2024-04-20', isCompleted: false, priority: 'Low' },
];
