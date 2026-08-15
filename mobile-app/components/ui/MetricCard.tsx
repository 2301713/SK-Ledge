import React from "react";
import { Text, View } from "react-native";

export default function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      className="mr-3 min-w-[120px] rounded-2xl bg-background p-3"
      accessibilityRole="summary"
    >
      <Text className="font-inter-extrabold text-lg text-primary">{value}</Text>
      <Text className="font-inter mt-1 text-xs text-secondary-foreground">{label}</Text>
    </View>
  );
}
