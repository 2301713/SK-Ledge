// types.ts
export interface Project {
  id: string;
  name: string;
  category: "Sports" | "Infrastructure" | "Health" | "Education";
  status: "Pending" | "Approved" | "Declined";
  budget: number;
}

export interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  role_type: "Chairman" | "Treasurer";
  barangay: string;
  account_status?: boolean;
}
