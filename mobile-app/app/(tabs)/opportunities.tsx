import { useRouter } from "expo-router";
import { ChevronRight, Filter, Search } from "lucide-react-native";
import React, { useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CATEGORIES, MOCK_OPPORTUNITIES } from "../../data/data";

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const router = useRouter();

  // Filter logic
  const filteredData = MOCK_OPPORTUNITIES.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const renderItem = ({ item }: { item: (typeof MOCK_OPPORTUNITIES)[0] }) => (
    <TouchableOpacity
      className="rounded-3xl border border-border bg-white p-5"
      style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 }}
      activeOpacity={0.7}
      onPress={() =>
        router.push({ pathname: "/opportunity/[id]", params: { id: item.id } })
      }
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-inter-extrabold text-xs uppercase tracking-[0.6px] text-primary">
          {item.department}
        </Text>
        <Text className="font-inter-bold text-xs text-danger">Closes: {item.deadline}</Text>
      </View>

      <Text className="font-inter-extrabold mb-[18px] text-lg leading-6 text-primary-foreground">
        {item.title}
      </Text>

      <View className="flex-row items-center gap-2">
        <View className="rounded-[10px] bg-background px-3 py-1.5">
          <Text className="font-inter-bold text-xs text-slate-600">{item.budget}</Text>
        </View>
        <View className="rounded-[10px] bg-background px-3 py-1.5">
          <Text className="font-inter-bold text-xs text-slate-600">{item.category}</Text>
        </View>

        <View className="flex-1" />

        <View className="h-8 w-8 items-center justify-center rounded-[10px] bg-background">
          <ChevronRight size={18} color="#0138A8" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      {/* HERO HEADER */}
      <View className="bg-primary px-6 pb-[50px] pt-3">
        <Text className="font-inter-extrabold text-[32px] tracking-tight text-white">
          Find Contracts
        </Text>
        <Text className="font-inter-medium mt-1.5 text-[15px] text-secondary-foreground">
          Browse open bidding opportunities
        </Text>
      </View>

      {/* MAIN BODY CONTENT */}
      <View className="flex-1 rounded-t-[30px] bg-background pt-6">
        {/* Search Bar Container */}
        <View className="mb-5 flex-row gap-3 px-6">
          <View
            className="h-[54px] flex-1 flex-row items-center rounded-2xl border border-border bg-white px-4"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}
          >
            <Search size={20} color="#64748B" />
            <TextInput
              className="font-inter-medium ml-2.5 flex-1 text-[15px] text-primary-foreground"
              placeholder="Search opportunities..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            className="h-[54px] w-[54px] items-center justify-center rounded-2xl bg-primary"
            style={{ shadowColor: "#0138A8", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }}
            activeOpacity={0.8}
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <View className="mb-5">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`rounded-[14px] border px-[18px] py-2.5 ${
                  activeCategory === item
                    ? "border-primary bg-primary"
                    : "border-border bg-white"
                }`}
                onPress={() => setActiveCategory(item)}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-inter-semibold text-sm ${
                    activeCategory === item ? "text-white" : "text-secondary-foreground"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Opportunities List */}
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center py-[60px]">
              <Text className="font-inter-medium text-[15px] text-secondary-foreground">
                No opportunities found.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}