import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function IndexPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });

      if (authError) {
        throw new Error(authError.message || "Invalid email or password.");
      }

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("vendors")
          .select("id, company_name, role, approval_status")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          // Sign out to avoid a broken session state
          await supabase.auth.signOut();
          throw new Error(
            "Failed to retrieve account details. Please try again.",
          );
        }

        if (profileData.approval_status === "pending") {
          await supabase.auth.signOut();
          Alert.alert(
            "Account Pending Approval",
            "Your vendor application is currently under review by the SK Federation. You will be notified once your account is approved.",
            [{ text: "OK" }],
          );
          return;
        }

        if (profileData.approval_status === "rejected") {
          await supabase.auth.signOut();
          Alert.alert(
            "Account Not Approved",
            "Your vendor application has been rejected. Please contact the SK Federation for more information.",
            [{ text: "OK" }],
          );
          return;
        }

        router.replace("/(tabs)/home");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Invalid login credentials.";
      Alert.alert("Authentication Failed", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* HERO HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>SK</Text>
          </View>
          <Text style={styles.titleText}>SK-Ledge</Text>
          <Text style={styles.subtitleText}>Secure Vendor Bidding Portal</Text>
        </View>

        {/* OVERLAPPING BODY */}
        <View style={styles.body}>
          <View style={styles.formContainer}>
            <View>
              <Text style={styles.labelText}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  placeholder="vendor@company.com"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            <View>
              <Text style={styles.labelText}>Secure Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#94A3B8" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              onPress={handleSignIn}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#003366" />
              ) : (
                <Text style={styles.primaryButtonText}>Access Portal</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              style={styles.secondaryButton}
              onPress={() => router.push("/register")}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>
                {`Don't have an account?`}{" "}
                <Text style={styles.secondaryLinkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#003366", // Bleeds background smoothly into system status bar
  },
  keyboardView: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: "#003366",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 70, // Extra padding to allow the body to overlap
  },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: "#FFCC00", // Inverted to stand out against the blue header
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    color: "#003366",
    fontSize: 34,
    fontWeight: "900",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#94A3B8", // Soft grey/blue so it recedes properly against the white title
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30, // Creates the fluid overlapping layout
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  formContainer: {
    gap: 24,
  },
  labelText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
  },
  actionContainer: {
    marginTop: 40,
    gap: 20,
  },
  primaryButton: {
    width: "100%",
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
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#003366",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: "#64748B",
    fontWeight: "500",
    fontSize: 14,
  },
  secondaryLinkText: {
    color: "#003366",
    fontWeight: "bold",
  },
});
