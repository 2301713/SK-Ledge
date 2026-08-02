export type StatusType = "Pending" | "Completed" | "Ongoing" | "Approved";

export interface Project {
  name: string;
  barangay: string;
  chair: string;
  date: string;
  budget: string;
  category: string;
  status: StatusType;
}
