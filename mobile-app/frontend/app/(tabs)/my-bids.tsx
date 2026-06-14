import { CheckCircle, Clock, XCircle } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MOCK_BIDS, TABS } from "../../data/data";

export default function MyBidsPage() {
  const [activeTab, setActiveTab] = useState("All");

  // Filter bids based on the selected tab
  const filteredBids = MOCK_BIDS.filter(
    (bid) => activeTab === "All" || bid.status === activeTab,
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Won":
        return {
          color: "#16A34A",
          bgColor: "#DCFCE7",
          icon: <CheckCircle size={14} color="#16A34A" />,
        };
      case "Lost":
        return {
          color: "#EF4444",
          bgColor: "#FEE2E2",
          icon: <XCircle size={14} color="#EF4444" />,
        };
      case "Pending":
      default:
        return {
          color: "#D97706",
          bgColor: "#FEF3C7",
          icon: <Clock size={14} color="#D97706" />,
        };
    }
  };

  const renderItem = ({ item }: { item: (typeof MOCK_BIDS)[0] }) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{item.contractTitle}</Text>
            <Text style={styles.departmentText}>{item.department}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            {statusConfig.icon}
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Submitted On</Text>
            <Text style={styles.dateText}>{item.submittedOn}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.amountLabel}>Your Bid Amount</Text>
            <Text style={styles.amountText}>{item.amount}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* HERO HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bids</Text>
        <Text style={styles.headerSubtitle}>Track your proposal history</Text>
      </View>

      {/* OVERLAPPING BODY */}
      <View style={styles.body}>
        {/* TABS */}
        <View style={styles.tabsContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        <FlatList
          data={filteredBids}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No bids found in this category.
              </Text>
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
    backgroundColor: "#003366", // Matches the header to bleed into the status bar
  },
  header: {
    backgroundColor: "#003366",
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 50, // Extra padding to allow the body to overlap
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
    marginTop: -30, // Creates the overlapping effect
    paddingTop: 24,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  tabButtonActive: {
    backgroundColor: "#003366",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  tabTextActive: {
    color: "#FFFFFF",
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
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  titleText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 4,
    lineHeight: 22,
  },
  departmentText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 14,
    color: "#1E293B",
    fontWeight: "600",
    marginTop: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amountText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#003366",
    marginTop: 2,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
});
