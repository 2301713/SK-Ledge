export interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  role_type: string;
  barangay: string;
  account_status?: boolean;
}

export type ProjectStatus =
  | "Pending BMO Alignment"
  | "Pending Approval"
  | "Approved"
  | "Rejected"
  | "Completed";

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  budget: number;
  date?: string;
  description?: string;
}
