import React from "react";
import { Text, View } from "react-native";

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  approved: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Approved" },
  completed: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Completed" },
  rejected: { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger", label: "Rejected" },
  pending: { bg: "bg-pending/10", text: "text-pending", dot: "bg-pending", label: "Pending" },
  "in progress": { bg: "bg-ongoing/10", text: "text-ongoing", dot: "bg-ongoing", label: "In Progress" },
  active: { bg: "bg-information/10", text: "text-information", dot: "bg-information", label: "Active" },
  verified: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Verified" },
  flagged: { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger", label: "Flagged" },
  clean: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Clean" },
  "pending docs": { bg: "bg-pending/10", text: "text-pending", dot: "bg-pending", label: "Incomplete" },
  evaluation: { bg: "bg-pending/10", text: "text-pending", dot: "bg-pending", label: "Evaluation" },
  authorized: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Authorized" },
  accepting: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Accepting" },
  won: { bg: "bg-success/10", text: "text-success", dot: "bg-success", label: "Won" },
  awarded: { bg: "bg-primary/10", text: "text-primary", dot: "bg-primary", label: "Awarded" },
  lost: { bg: "bg-danger/10", text: "text-danger", dot: "bg-danger", label: "Lost" },
};

const FALLBACK = {
  bg: "bg-secondary",
  text: "text-secondary-foreground",
  dot: "bg-secondary-foreground",
};

export default function StatusBadge({
  status,
  showDot = false,
}: {
  status?: string | null;
  showDot?: boolean;
}) {
  const normalized = (status ?? "pending").toString().trim().toLowerCase();
  const config = STATUS_MAP[normalized] ?? FALLBACK;
  const label = STATUS_MAP[normalized]?.label ?? (status || "Unknown");

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${config.bg}`}
      accessibilityLabel={`Status ${label}`}
    >
      {showDot && <View className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
      <Text className={`font-inter-semibold text-xs ${config.text}`}>{label}</Text>
    </View>
  );
}
