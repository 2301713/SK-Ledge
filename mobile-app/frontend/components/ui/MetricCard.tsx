import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 10,
    marginRight: 12,
    minWidth: 120,
  },
  value: { fontSize: 18, fontWeight: "800", color: "#003366" },
  label: { fontSize: 12, color: "#64748B", marginTop: 4 },
});
