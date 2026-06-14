export const MOCK_OPPORTUNITIES = [
  {
    id: "1",
    title: "IT Infrastructure Upgrade Phase 2",
    department: "Department of Technology",
    budget: "₱50k - ₱100k",
    deadline: "May 22, 2026",
    category: "IT & Tech",
  },
  {
    id: "2",
    title: "Office Supplies Provisioning 2026",
    department: "General Services",
    budget: "₱10k - ₱25k",
    deadline: "May 29, 2026",
    category: "Logistics",
  },
  {
    id: "3",
    title: "City Hall HVAC Maintenance",
    department: "Public Works",
    budget: "₱25k - ₱50k",
    deadline: "Jun 05, 2026",
    category: "Maintenance",
  },
  {
    id: "4",
    title: "Fleet Vehicle Replacement",
    department: "Transportation Dept",
    budget: "₱200k+",
    deadline: "Jun 15, 2026",
    category: "Vehicles",
  },
  {
    id: "5",
    title: "Cybersecurity Audit & Penetration Testing",
    department: "Department of Technology",
    budget: "₱30k - ₱60k",
    deadline: "Jun 01, 2026",
    category: "IT & Tech",
  },
];

export const CATEGORIES = [
  "All",
  "IT & Tech",
  "Logistics",
  "Maintenance",
  "Vehicles",
];

// Mock data for submitted bids
export const MOCK_BIDS = [
  {
    id: "b1",
    contractTitle: "IT Infrastructure Upgrade Phase 2",
    department: "Department of Technology",
    amount: "$75,000",
    submittedOn: "May 15, 2026",
    status: "Pending",
  },
  {
    id: "b2",
    contractTitle: "City Hall HVAC Maintenance",
    department: "Public Works",
    amount: "$42,500",
    submittedOn: "Apr 20, 2026",
    status: "Won",
  },
  {
    id: "b3",
    contractTitle: "Downtown Park Landscaping",
    department: "Parks & Recreation",
    amount: "$18,000",
    submittedOn: "Mar 10, 2026",
    status: "Lost",
  },
  {
    id: "b4",
    contractTitle: "Fleet Vehicle Replacement",
    department: "Transportation Dept",
    amount: "$210,000",
    submittedOn: "May 10, 2026",
    status: "Pending",
  },
];

export const TABS = ["All", "Pending", "Won", "Lost"];
