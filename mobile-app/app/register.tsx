import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Briefcase, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!companyName || !email || !password) {
      Alert.alert("Missing Info", "Please fill out all fields to register.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            company_name: companyName,
            role: "vendor",
            approval_status: "pending",
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (data?.session) {
        await supabase.auth.signOut();
      }

      Alert.alert(
        "Application Submitted!",
        "Your vendor application has been received and is pending approval by the SK Federation. You will be able to log in once your account is approved.",
        [{ text: "OK", onPress: () => router.replace("/") }],
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      Alert.alert("Registration Failed", message);
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO HEADER */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>SK</Text>
            </View>
            <Text style={styles.titleText}>Apply as Vendor</Text>
            <Text style={styles.subtitleText}>Join the SK-Ledge network</Text>
          </View>

          {/* OVERLAPPING BODY */}
          <View style={styles.body}>
            <View style={styles.formContainer}>
              <View>
                <Text style={styles.labelText}>Company / Vendor Name</Text>
                <View style={styles.inputContainer}>
                  <Briefcase size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.input}
                    placeholder="Acme Corp"
                    placeholderTextColor="#94A3B8"
                    value={companyName}
                    onChangeText={setCompanyName}
                    editable={!loading}
                  />
                </View>
              </View>

              <View>
                <Text style={styles.labelText}>Corporate Email</Text>
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
                onPress={handleSignUp}
                disabled={loading}
                activeOpacity={0.8}
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#003366" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Submit Application
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.6}
                style={styles.secondaryButton}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={styles.secondaryText}>
                  Already an SK registered vendor?{" "}
                  <Text style={styles.secondaryLinkText}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#003366",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: "#003366",
    alignItems: "center",
    paddingTop: 30,
    paddingBottom: 70,
  },
  logoContainer: {
    width: 90,
    height: 90,
    backgroundColor: "#FFCC00",
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
    color: "#94A3B8",
  },
  body: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 60,
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
  secondaryText: {
    color: "#64748B",
    fontWeight: "500",
    fontSize: 14,
  },
  secondaryLinkText: {
    color: "#003366",
    fontWeight: "bold",
  },
});
