// lib/dummyData.ts

import { ApprovalRequest } from "@/app/coa_dashboard/types";

export const dummyProjects = [
  {
    id: "1",
    name: "Youth Basketball League",
    category: "Sports",
    status: "Approved",
    budget: 45000,
  },
  {
    id: "2",
    name: "SK Scholarship Grant",
    category: "Education",
    status: "Pending",
    budget: 120000,
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
