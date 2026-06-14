import { supabase } from "@/lib/supabase";
import { CreditCard, LogOut } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("Loading...");
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.company_name) {
        setCompanyName(user.user_metadata.company_name);
      } else {
        setCompanyName("Unknown Company");
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {companyName ? companyName.charAt(0).toUpperCase() : "V"}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>
                Verified Vendor • Since 2026
              </Text>
            </View>
          </View>
        </View>

        {/* MAIN BODY CONTENT */}
        <View style={styles.body}>
          {/* PAYMENT CARD */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <CreditCard size={20} color="#003366" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Payout Details</Text>
                <Text style={styles.cardSubtitle}>Banking & verification</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              {hasPaymentMethod ? (
                <View>
                  <Text style={styles.monoText}>Account: **** 1234</Text>
                  <Text style={styles.monoText}>Bank: Mock Bank</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.unlinkedText}>
                    No banking credentials attached.
                  </Text>
                  <Text style={styles.unlinkedSubtext}>
                    Connect your business banking to clear verification and
                    accept direct contract deposits.
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.actionButton} activeOpacity={0.85}>
              <Text style={styles.actionButtonText}>
                {hasPaymentMethod
                  ? "Modify Financial Routing"
                  : "Link Verification Bank Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <View style={styles.logoutIconContainer}>
                  <LogOut size={18} color="#EF4444" />
                </View>
                <Text style={styles.logoutText}>Log out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#003366",
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#003366",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 50,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#003366",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  companyName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: "#003366",
    fontWeight: "700",
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 30,
    paddingBottom: 40,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#003366",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
  },
  cardContent: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  monoText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "600",
    marginBottom: 4,
  },
  unlinkedText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  unlinkedSubtext: {
    fontSize: 13,
    color: "#94A3B8",
    lineHeight: 18,
  },
  actionButton: {
    backgroundColor: "#003366",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFCC00",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFE4E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 16,
    fontWeight: "800",
  },
});
