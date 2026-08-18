export interface Opportunity {
  id: string;
  title: string;
  department: string;
  budget: string;
  deadline: string;
  category: string;
  description?: string;
  created_at?: string;
}

export const CATEGORIES = [
  "All",
  "IT & Tech",
  "Logistics",
  "Maintenance",
  "Vehicles",
];

export const TABS = ["All", "Pending", "Won", "Lost"];