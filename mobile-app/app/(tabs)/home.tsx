import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  Trophy,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomePage() {
  const [companyName, setCompanyName] = useState("Vendor");

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.company_name) {
        setCompanyName(user.user_metadata.company_name);
      }
    };

    fetchUserData();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />

      {/* Dark Brand Header */}
      <SafeAreaView style={styles.headerBackground} edges={["top"]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greetingText}>Welcome back,</Text>
            <Text style={styles.companyText}>{companyName}</Text>
          </View>
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{companyName.charAt(0)}</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Dashboard Stats Card */}
        <View style={styles.statsFloatingCard}>
          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: "#F0F9FF" }]}>
              <Briefcase size={22} color="#0284C7" />
            </View>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Active Bids</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: "#FEF3C7" }]}>
              <CircleDollarSign size={22} color="#D97706" />
            </View>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.iconWrapper, { backgroundColor: "#DCFCE7" }]}>
              <Trophy size={22} color="#16A34A" />
            </View>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Contracts</Text>
          </View>
        </View>

        {/* Recent Opportunities Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>New Opportunities</Text>
          </View>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.opportunitiesList}>
          {/* Modern Opportunity Card 1 */}
          <TouchableOpacity style={styles.opportunityCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>Dept. of Technology</Text>
              </View>
              <Text style={styles.timeText}>Closes in 5d</Text>
            </View>

            <Text style={styles.opportunityTitle}>
              IT Infrastructure Upgrade Phase 2
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.tagContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Hardware</Text>
                </View>
                <View style={[styles.tag, styles.tagHighlight]}>
                  <Text style={styles.tagTextHighlight}>₱50k - ₱100k</Text>
                </View>
              </View>
              <View style={styles.actionButton}>
                <ChevronRight size={18} color="#003366" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Modern Opportunity Card 2 */}
          <TouchableOpacity style={styles.opportunityCard} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>General Services</Text>
              </View>
              <Text style={styles.timeText}>Closes in 12d</Text>
            </View>

            <Text style={styles.opportunityTitle}>
              Office Supplies Provisioning 2026
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.tagContainer}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Logistics</Text>
                </View>
                <View style={[styles.tag, styles.tagHighlight]}>
                  <Text style={styles.tagTextHighlight}>₱10k - ₱25k</Text>
                </View>
              </View>
              <View style={styles.actionButton}>
                <ChevronRight size={18} color="#003366" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  headerBackground: {
    backgroundColor: "#003366",
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backdropFilter: "blur(20px)",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  greetingText: {
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 4,
  },
  companyText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFCC00",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFCC00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003366",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsFloatingCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: "#003366",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F1F5F9",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    marginLeft: 6,
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
  },
  seeAllText: {
    color: "#003366",
    fontWeight: "700",
    fontSize: 14,
  },
  opportunitiesList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  opportunityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#94A3B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  departmentBadge: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  departmentText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  opportunityTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 16,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagContainer: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  tagHighlight: {
    backgroundColor: "#FEF3C7",
  },
  tagText: {
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },
  tagTextHighlight: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "700",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
});
