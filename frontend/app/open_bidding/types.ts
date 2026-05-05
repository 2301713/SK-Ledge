export interface FilterGroupProps {
  label: string;
  value: string;
}

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  lineColor: string;
  isActive?: boolean;
  subtitle?: string;
}

export interface StatusBadgeProps {
  status: string;
  isLarge?: boolean;
}

export interface TimelineItemProps {
  label: string;
  date?: string;
  active?: boolean;
  isStar?: boolean;
  isInactive?: boolean;
}

export const biddingProjects = [
  {
    id: "BID-2026-042",
    name: "Construction of Youth Hub",
    location: "Brgy. San Jose; ABC",
    abc: 1200000.0,
    status: "Accepting Bids",
    deadline: "May 20, 2026",
    daysLeft: 12,
    description:
      "Provision of materials and labor for the construction of a 2-story Youth Hub intended for multi-purpose skills training and seminars.",
    preBid: "May 10, 2026",
    opening: "May 22, 2026",
    award: "June 05, 2026",
  },
  {
    id: "BID-2026-039",
    name: "IT Equipment Procurement (Laptops)",
    location: "Poblacion I; ABC",
    abc: 450000.0,
    status: "Awarded",
    deadline: "Apr 15, 2026",
    daysLeft: 0,
    description:
      "Purchase of high-performance laptops for SK Digital Literacy Program.",
    preBid: "Apr 01, 2026",
    opening: "Apr 16, 2026",
    award: "Apr 20, 2026",
    winner: "TechFlow Solutions Inc.",
    winningBid: 435000.0,
  },
  {
    id: "BID-2026-045",
    name: "Sports Equipment Supplies",
    location: "Brgy. San Rafael; ABC",
    abc: 150000.0,
    status: "Evaluation",
    deadline: "May 2, 2026",
    daysLeft: 0,
    description: "Supply and delivery of professional sports equipment.",
    preBid: "Apr 28, 2026",
    opening: "May 03, 2026",
    award: "May 10, 2026",
  },
];
