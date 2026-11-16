import { BATANGAS_BARANGAYS } from "@/lib/batangasBarangays";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Searchable picker over the Batangas barangay reference list. Selecting
 * "Not assigned" clears the value, which the update_vendor_profile RPC stores
 * as 'N/A'.
 */
export default function BarangayPicker({
  value,
  onChange,
  disabled = false,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return BATANGAS_BARANGAYS;
    return BATANGAS_BARANGAYS.filter((barangay) =>
      barangay.toLowerCase().includes(needle),
    );
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const select = (next: string) => {
    onChange(next);
    close();
  };

  return (
    <>
      <View>
        <Text className="font-inter-bold mb-2 ml-0.5 text-[10px] uppercase tracking-[0.16em] text-secondary-foreground">
          Barangay
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Select barangay"
          className={`h-[52px] flex-row items-center rounded-xl border bg-white px-4 ${
            error ? "border-danger" : "border-border"
          } ${disabled ? "opacity-60" : ""}`}
          onPress={() => {
            if (!disabled) setOpen(true);
          }}
          disabled={disabled}
          activeOpacity={0.75}
        >
          <MapPin size={17} color={error ? "#DC2626" : "#94A3B8"} />
          <Text
            className={`font-inter-medium ml-3 flex-1 text-[15px] ${
              value ? "text-primary-foreground" : "text-[#94A3B8]"
            }`}
            numberOfLines={1}
          >
            {value || "Select your barangay"}
          </Text>
          <ChevronDown size={17} color="#94A3B8" />
        </TouchableOpacity>
        {error ? (
          <Text className="font-inter-medium mt-1.5 ml-0.5 text-[11px] text-danger">
            {error}
          </Text>
        ) : null}
      </View>

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={close}
      >
        <View className="flex-1 justify-end bg-black/40">
          <SafeAreaView
            className="rounded-t-3xl bg-white"
            edges={["bottom"]}
            style={{ maxHeight: "85%" }}
          >
            <View className="flex-row items-center justify-between px-5 pb-1 pt-4">
              <View>
                <Text className="font-inter-black text-[16px] tracking-tight text-primary-foreground">
                  Select barangay
                </Text>
                <Text className="font-inter text-[10px] text-secondary-foreground">
                  Batangas barangays · search by name or municipality
                </Text>
              </View>
              <TouchableOpacity onPress={close} hitSlop={10}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View className="mx-5 mb-3 mt-3 h-11 flex-row items-center rounded-xl border border-border bg-secondary/40 px-3">
              <Search size={16} color="#94A3B8" />
              <TextInput
                className="font-inter-medium ml-2 flex-1 text-[14px] text-primary-foreground"
                placeholder="Search barangay or municipality"
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query ? (
                <TouchableOpacity onPress={() => setQuery("")} hitSlop={10}>
                  <X size={15} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              className="pb-2"
              ListHeaderComponent={
                <TouchableOpacity
                  className={`flex-row items-center justify-between px-5 py-3 ${
                    value ? "" : "bg-secondary/60"
                  }`}
                  onPress={() => select("")}
                  activeOpacity={0.75}
                >
                  <Text className="font-inter-medium flex-1 pr-3 text-[13px] text-secondary-foreground">
                    Not assigned
                  </Text>
                  {value ? null : <Check size={16} color="#0138A8" />}
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <Text className="font-inter-medium px-5 py-6 text-center text-[12px] text-secondary-foreground">
                  No barangay matches “{query.trim()}”.
                </Text>
              }
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <TouchableOpacity
                    className={`flex-row items-center justify-between border-b border-border/50 px-5 py-3 ${
                      selected ? "bg-secondary/60" : ""
                    }`}
                    onPress={() => select(item)}
                    activeOpacity={0.75}
                  >
                    <Text
                      className="font-inter-medium flex-1 pr-3 text-[13px] text-primary-foreground"
                      numberOfLines={1}
                    >
                      {item}
                    </Text>
                    {selected ? <Check size={16} color="#0138A8" /> : null}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
