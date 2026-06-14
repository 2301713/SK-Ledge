export interface ApprovalRequest {
  id: number;
  department: string;
  purpose: string;
  amount: string;
  status: "Pending" | "Approved";
}

export interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  role_type: string;
  barangay: string;
  account_status?: boolean;
}

export const pendingDisbursements = [
  {
    id: "DV-2026-0892",
    payee: "Metro Office Supplies Inc.",
    category: "MOOE - Supplies",
    amount: 45000.0,
    dateSubmitted: "May 4, 2026",
    compliance: "Clean",
    brgy: "Brgy. San Jose",
  },
  {
    id: "DV-2026-0893",
    payee: "Apex Construction Services",
    category: "Capital Outlay",
    amount: 350000.0,
    dateSubmitted: "May 3, 2026",
    compliance: "Flagged",
    brgy: "Brgy. San Rafael",
  },
  {
    id: "DV-2026-0895",
    payee: "Maria Santos (Cash Advance)",
    category: "Travel Expenses",
    amount: 12500.0,
    dateSubmitted: "May 2, 2026",
    compliance: "Pending Docs",
    brgy: "Brgy. San Jose",
  },
];

export interface VerifiedTransaction {
  id: string;
  amount: number;
  vendor: string;
  category: string;
  date: string;
  status: "verified" | "pending" | "flagged";
  blockchainHash: string;
  receiptCount: number;
  projectId?: string;
}

export interface ProjectStatus {
  id: string;
  name: string;
  budget: number;
  spent: number;
  status: "active" | "completed" | "on-hold";
  lastAudit: string;
  complianceScore: number;
}
