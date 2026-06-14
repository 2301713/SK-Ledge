import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building,
  Calendar,
  Download,
  FileText,
  PhilippinePeso as Peso,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// A mock function to simulate fetching data from Supabase using the ID
const fetchOpportunityDetails = (id: string) => {
  return {
    id,
    title: "IT Infrastructure Upgrade Phase 2",
    department: "Department of Technology",
    budget: "₱50k - ₱100k",
    deadline: "May 22, 2026",
    category: "IT & Tech",
    status: "Open",
    description:
      "The Department of Technology is seeking a highly qualified vendor to overhaul and upgrade the core network infrastructure across 3 primary municipal buildings. The chosen vendor will be responsible for hardware procurement, installation, and initial configuration.",
    requirements: [
      "Minimum 5 years of experience in enterprise network deployments.",
      "Valid ISO 27001 Certification.",
      "Ability to provide 24/7 SLA support for 90 days post-installation.",
    ],
    documents: [
      { id: "d1", name: "Scope_of_Work_v2.pdf", size: "2.4 MB" },
      { id: "d2", name: "Vendor_Compliance_Terms.pdf", size: "845 KB" },
    ],
  };
};

export default function OpportunityDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);

  useEffect(() => {
    // In production, this is where you would do:
    // const { data } = await supabase.from('opportunities').select('*').eq('id', id).single();
    if (id) {
      const data = fetchOpportunityDetails(id);
      setOpportunity(data);
    }
  }, [id]);

  if (!opportunity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ padding: 24 }}>Loading contract details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contract Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.badgeContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{opportunity.category}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{opportunity.status}</Text>
            </View>
          </View>

          <Text style={styles.title}>{opportunity.title}</Text>

          <View style={styles.departmentRow}>
            <Building size={16} color="#64748B" />
            <Text style={styles.departmentText}>{opportunity.department}</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Peso size={20} color="#003366" />
            <Text style={styles.statLabel}>Estimated Budget</Text>
            <Text style={styles.statValue}>{opportunity.budget}</Text>
          </View>
          <View style={styles.statBox}>
            <Calendar size={20} color="#EF4444" />
            <Text style={styles.statLabel}>Closing Date</Text>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {opportunity.deadline}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scope of Work</Text>
          <Text style={styles.paragraph}>{opportunity.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Requirements</Text>
          {opportunity.requirements.map((req: string, index: number) => (
            <View key={index} style={styles.bulletRow}>
              <View style={styles.bulletPoint} />
              <Text style={styles.bulletText}>{req}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attached Documents</Text>
          {opportunity.documents.map((doc: any) => (
            <TouchableOpacity key={doc.id} style={styles.documentCard}>
              <View style={styles.docIconWrapper}>
                <FileText size={20} color="#003366" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{doc.name}</Text>
                <Text style={styles.docSize}>{doc.size}</Text>
              </View>
              <Download size={20} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/submit-bid/[id]",
              params: { id: opportunity.id },
            })
          }
        >
          <Text style={styles.primaryButtonText}>Prepare Bid Proposal</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  topSection: {
    marginBottom: 24,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: "#E0E7FF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  categoryText: {
    color: "#4338CA",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 12,
  },
  departmentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  departmentText: {
    fontSize: 15,
    color: "#64748B",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1E293B",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: "#475569",
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingRight: 16,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#003366",
    marginTop: 8,
    marginRight: 12,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475569",
    flex: 1,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  docIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  docSize: {
    fontSize: 12,
    color: "#94A3B8",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32, // Accommodates home indicator on iOS
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  primaryButton: {
    backgroundColor: "#FFCC00",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFCC00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: "#003366",
    fontSize: 18,
    fontWeight: "bold",
  },
});
