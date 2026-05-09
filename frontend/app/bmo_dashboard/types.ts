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

export const procurementProjects: ProcurementProject[] = [
  {
    id: "BID-2026-045",
    title: "Sports Equipment Supplies",
    barangay: "Brgy. San Rafael",
    abc: 150000.0,
    status: "Evaluation",
    deadline: "May 2, 2026",
    bids: [
      {
        id: "v1",
        vendorName: "Titan Sports Inc.",
        bidAmount: 145000,
        dateSubmitted: "Apr 28, 2026",
        status: "Evaluated",
        documentsValid: true,
      },
      {
        id: "v2",
        vendorName: "Metro Athletics",
        bidAmount: 148500,
        dateSubmitted: "Apr 29, 2026",
        status: "Evaluated",
        documentsValid: true,
      },
      {
        id: "v3",
        vendorName: "QuickPlay Goods",
        bidAmount: 152000,
        dateSubmitted: "May 1, 2026",
        status: "Pending",
        documentsValid: false,
      },
    ],
  },
  {
    id: "BID-2026-042",
    title: "Construction of Youth Hub",
    barangay: "Brgy. San Jose",
    abc: 1200000.0,
    status: "Accepting Bids",
    deadline: "May 20, 2026",
    bids: [
      {
        id: "v4",
        vendorName: "Apex Builders",
        bidAmount: 1180000,
        dateSubmitted: "May 4, 2026",
        status: "Pending",
        documentsValid: true,
      },
    ],
  },
];
