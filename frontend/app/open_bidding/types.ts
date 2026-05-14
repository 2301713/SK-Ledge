import type { ReactNode } from "react";

export interface BiddingProject {
  id: string;
  name: string;
  location: string;
  abc: number;
  status: string;
  deadline: string;
  daysLeft: number;
  description: string;
  preBid: string;
  opening: string;
  award: string;
  winner?: string;
  winningBid?: number;
}

export interface FilterGroupProps {
  label: string;
  value: string;
}

export interface StatCardProps {
  icon: ReactNode;
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
