import { useRouter } from "expo-router";
import { ChevronRight, Filter, Search } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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
      style={styles.card}
      activeOpacity={0.7}
      onPress={() =>
        router.push({ pathname: "/opportunity/[id]", params: { id: item.id } })
      }
    >
      <View style={styles.cardHeader}>
        <Text style={styles.departmentText}>{item.department}</Text>
        <Text style={styles.deadlineText}>Closes: {item.deadline}</Text>
      </View>

      <Text style={styles.titleText}>{item.title}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.budget}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.category}</Text>
        </View>

        <View style={styles.spacer} />

        <View style={styles.iconWrapper}>
          <ChevronRight size={18} color="#003366" />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* HERO HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Contracts</Text>
        <Text style={styles.headerSubtitle}>
          Browse open bidding opportunities
        </Text>
      </View>

      {/* MAIN BODY CONTENT */}
      <View style={styles.body}>
        {/* Search Bar Container */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Search size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search opportunities..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} activeOpacity={0.8}>
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  activeCategory === item && styles.categoryPillActive,
                ]}
                onPress={() => setActiveCategory(item)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === item && styles.categoryTextActive,
                  ]}
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
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No opportunities found.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#003366",
  },
  header: {
    backgroundColor: "#003366",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 50,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#94A3B8",
    marginTop: 6,
    fontWeight: "500",
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 24,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 20,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
  },
  filterButton: {
    width: 54,
    height: 54,
    backgroundColor: "#003366",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#003366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesList: {
    paddingHorizontal: 24,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
  },
  categoryPillActive: {
    backgroundColor: "#FFCC00",
    borderColor: "#FFCC00",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  categoryTextActive: {
    color: "#003366",
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  departmentText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#003366",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  deadlineText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "700",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 18,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tag: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
  },
  spacer: {
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
  },
});
