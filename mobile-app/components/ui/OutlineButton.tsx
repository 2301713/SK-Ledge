import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function OutlineButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.btn}
    >
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  text: { color: "#003366", fontWeight: "700" },
});
