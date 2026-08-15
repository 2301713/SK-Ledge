import { Bell, Search } from "lucide-react-native";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function TopBar({
  userName,
  searchValue,
  onSearchChange,
  hideSearch = false,
}: {
  userName: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideSearch?: boolean;
}) {
  const hasSearch = typeof onSearchChange === "function";

  return (
    <View className="flex-row items-center gap-3">
      {!hideSearch && (
        <View className="relative flex-1">
          <View className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <Search size={16} color="#64748B" />
          </View>
          <TextInput
            value={searchValue}
            onChangeText={(value) => onSearchChange?.(value)}
            editable={hasSearch}
            placeholder="Search..."
            placeholderTextColor="#64748B"
            className="rounded-2xl border border-border bg-white py-2.5 pl-11 pr-4 text-sm text-primary-foreground"
            style={{ shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}
          />
        </View>
      )}

      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.8}
        className="relative h-10 w-10 items-center justify-center rounded-full border border-border bg-white"
        style={{ shadowColor: "#0F172A", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 }}
      >
        <Bell size={16} color="#64748B" />
        <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-danger" />
      </TouchableOpacity>

      <View className="flex-row items-center gap-2 border-l border-border pl-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
          <Text className="font-inter-bold text-sm text-white">
            {userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}