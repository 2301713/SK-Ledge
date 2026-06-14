import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function FilePlaceholder({ onPick }: { onPick?: () => void }) {
  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        onPress={onPick}
        style={styles.box}
        accessibilityLabel="Pick document"
      >
        <Text style={styles.text}>Attach document (mock)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 8 },
  box: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  text: { color: "#64748B" },
});
