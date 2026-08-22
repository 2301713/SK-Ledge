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
}

export interface VendorBid {
  id: string;
  vendorName: string;
  bidAmount: number;
  dateSubmitted: string;
  status: "Pending" | "Evaluated" | "Awarded";
  documentsValid: boolean;
}

export interface ProcurementProject {
  id: string;
  title: string;
  barangay: string;
  abc: number;
  status: "Accepting Bids" | "Evaluation" | "Awarded";
  deadline: string;
  bids: VendorBid[];
}
