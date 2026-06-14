import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, string> = {
  Accepting: "#10B981",
  Awarded: "#003366",
  Evaluation: "#F59E0B",
  Pending: "#F59E0B",
};

export default function StatusBadge({ status }: { status: string }) {
  const color = COLORS[status] ?? "#64748B";
  return (
    <View
      style={[styles.badge, { backgroundColor: color + "22" }]}
      accessibilityLabel={`Status ${status}`}
    >
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  text: { fontSize: 12, fontWeight: "700" },
});
