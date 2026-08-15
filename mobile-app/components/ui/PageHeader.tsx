import React from "react";
import { Text, View } from "react-native";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  className = "",
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <View className={`flex-col gap-4 ${className}`}>
      <View>
        {eyebrow && (
          <Text className="font-inter-semibold text-xs uppercase tracking-[0.25em] text-primary">
            {eyebrow}
          </Text>
        )}
        <Text className="font-inter-bold mt-1 text-3xl tracking-tight text-primary-foreground">
          {title}
        </Text>
        {subtitle && (
          <Text className="font-inter mt-1.5 text-sm text-secondary-foreground">{subtitle}</Text>
        )}
      </View>
      {actions && <View className="flex-row flex-wrap items-center gap-3">{actions}</View>}
    </View>
  );
}