import React from "react";
import { Text, View } from "react-native";

export default function CardHeader({
  title,
  subtitle,
  eyebrow,
  action,
  className = "",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`mb-6 flex-row items-start justify-between gap-4 ${className}`}>
      <View className="flex-1">
        {eyebrow && (
          <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-secondary-foreground">
            {eyebrow}
          </Text>
        )}
        <Text className="font-inter-bold text-lg tracking-tight text-primary-foreground">
          {title}
        </Text>
        {subtitle && (
          <Text className="font-inter mt-0.5 text-sm text-secondary-foreground">{subtitle}</Text>
        )}
      </View>
      {action}
    </View>
  );
}