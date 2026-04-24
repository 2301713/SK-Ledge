export interface ApprovalRequest {
  id: number;
  department: string;
  purpose: string;
  amount: string;
  status: "Pending" | "Approved";
}

export interface UserAccount {
  name: string;
  role: string;
  barangay: string;
}
