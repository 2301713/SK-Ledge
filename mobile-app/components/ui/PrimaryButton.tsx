import React from "react";
import { Text, TouchableOpacity } from "react-native";

export default function PrimaryButton({
  children,
  onPress,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Primary action"
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      className={`items-center justify-center rounded-2xl bg-tertiary py-4 ${className}`}
      style={{ shadowColor: "#FBD219", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
    >
      <Text className="font-inter-extrabold text-lg text-primary-foreground">{children}</Text>
    </TouchableOpacity>
  );
}
