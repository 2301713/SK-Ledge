export type StatusType = "ongoing" | "done" | "pending";

export interface Project {
  name: string;
  barangay: string;
  chair: string;
  date: string;
  budget: string;
  category: string;
  status: StatusType;
}
