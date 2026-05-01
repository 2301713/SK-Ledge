// types.ts
export interface Project {
  id: string;
  name: string;
  category: "Sports" | "Infrastructure" | "Health" | "Education";
  status: "Pending" | "Approved" | "Declined";
  budget: number;
}

export interface UserAccount {
  name: string;
  role_type: "Chairman" | "Treasurer";
  barangay: string;
}
