import { Shadows } from "@/constants/theme";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";

export default function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  variant?: "default" | "brand";
}) {
  const isBrand = variant === "brand";

  return (
    <View
      className={`flex-col gap-4 rounded-3xl p-6 ${
        isBrand
          ? "bg-primary"
          : "border border-border bg-white"
      }`}
      style={isBrand ? Shadows.brand : Shadows.card}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          className={`font-inter-semibold text-xs uppercase tracking-widest ${
            isBrand ? "text-white/70" : "text-secondary-foreground"
          }`}
        >
          {label}
        </Text>
        <View
          className={`h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isBrand ? "bg-white/10" : "bg-secondary"
          }`}
        >
          <Icon size={20} color={isBrand ? "#FFFFFF" : "#1E293B"} />
        </View>
      </View>

      <Text
        className={`font-inter-extrabold text-4xl tracking-tight ${
          isBrand ? "text-white" : "text-primary-foreground"
        }`}
      >
        {value}
      </Text>
    </View>
  );
}