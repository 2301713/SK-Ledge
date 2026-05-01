// lib/dummyData.ts

import { ApprovalRequest } from "@/app/coa_dashboard/types";

export type ProjectStatus = "Approved" | "Pending" | "Rejected";

export type Project = {
  id: string;
  name: string;
  category: string;
  status: ProjectStatus;
  budget: number;
  proposedBy: string;
  dateProposed: string;
};

// CONSTANTS
export const PROJECT_CATEGORIES = [
  "Infrastructure",
  "Livelihood",
  "Health & Wellness",
  "Education",
  "Environment",
  "Sports & Recreation",
  "Culture & Arts",
  "Peace & Order",
  "Others",
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "1",
    name: "Basketball Court Repair",
    category: "Sports & Recreation",
    status: "Approved",
    budget: 45000,
    proposedBy: "Juan dela Cruz",
    dateProposed: "Apr 10, 2026",
  },
  {
    id: "2",
    name: "Livelihood Seminar Series",
    category: "Livelihood",
    status: "Pending",
    budget: 28500,
    proposedBy: "Maria Santos",
    dateProposed: "Apr 18, 2026",
  },
  {
    id: "3",
    name: "Tree Planting Drive",
    category: "Environment",
    status: "Approved",
    budget: 12000,
    proposedBy: "Jose Reyes",
    dateProposed: "Apr 22, 2026",
  },
];

export const dummyApprovals: ApprovalRequest[] = [
  {
    id: 1,
    department: "HR",
    purpose: "Hiring (2 staff)",
    amount: "₱15,000",
    status: "Pending",
  },
  {
    id: 2,
    department: "IT",
    purpose: "Computer Maintenance",
    amount: "₱10,000",
    status: "Pending",
  },
  {
    id: 3,
    department: "Engineering",
    purpose: "Road Repair",
    amount: "₱20,000",
    status: "Pending",
  },
];

export const dummyDisbursements = [
  {
    id: 1,
    project: "Office Supplies",
    department: "Admin",
    amount: "₱5,000",
  },
  {
    id: 2,
    project: "Fuel Allocation",
    department: "Engineering",
    amount: "₱8,000",
  },
];
