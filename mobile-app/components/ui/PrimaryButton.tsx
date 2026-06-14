import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

export default function PrimaryButton({
  children,
  onPress,
}: {
  children: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Primary action"
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
    backgroundColor: "#FFCC00",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  text: { color: "#001019", fontWeight: "800" },
});
