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
