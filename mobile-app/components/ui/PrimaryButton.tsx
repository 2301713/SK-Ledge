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
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      className={`h-14 flex-row items-center justify-center gap-2 rounded-xl bg-primary px-5 ${
        disabled ? "opacity-60" : ""
      } ${className}`}
      style={{
        shadowColor: "#0138A8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
        elevation: 4,
      }}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text className="font-inter-black text-[12px] uppercase tracking-[0.16em] text-white">
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
