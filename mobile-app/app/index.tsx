import PrimaryButton from "@/components/ui/PrimaryButton";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* HERO HEADER */}
        <View className="items-center bg-primary pb-[70px] pt-[30px]">
          <View
            className="mb-5 h-[90px] w-[90px] items-center justify-center rounded-3xl bg-tertiary"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}
          >
            <Text className="font-inter-black text-[34px] text-primary">SK</Text>
          </View>
          <Text className="font-inter-extrabold mb-1.5 text-[32px] tracking-tight text-white">
            SK-Ledge
          </Text>
          <Text className="font-inter-medium text-[15px] text-secondary-foreground">
            Secure Vendor Bidding Portal
          </Text>
        </View>

        {/* OVERLAPPING BODY */}
        <View className="flex-1 rounded-t-[30px] bg-background px-8 pt-10">
          <View className="gap-6">
            <View>
              <Text className="font-inter-bold mb-2 ml-1 text-xs uppercase tracking-[1px] text-secondary-foreground">
                Email Address
              </Text>
              <View className="h-14 flex-row items-center rounded-2xl border border-border bg-white px-4"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}
              >
                <Mail size={20} color="#64748B" />
                <TextInput
                  className="font-inter-medium ml-3 flex-1 text-base text-primary-foreground"
                  placeholder="vendor@company.com"
                  placeholderTextColor="#64748B"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
              </View>
            </View>

            <View>
              <Text className="font-inter-bold mb-2 ml-1 text-xs uppercase tracking-[1px] text-secondary-foreground">
                Secure Password
              </Text>
              <View className="h-14 flex-row items-center rounded-2xl border border-border bg-white px-4"
                style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}
              >
                <Lock size={20} color="#64748B" />
                <TextInput
                  className="font-inter-medium ml-3 flex-1 text-base text-primary-foreground"
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-10 gap-5">
            <PrimaryButton onPress={handleSignIn} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#1E293B" />
              ) : (
                "Access Portal"
              )}
            </PrimaryButton>

            <TouchableOpacity
              activeOpacity={0.6}
              className="items-center py-2"
              onPress={() => router.push("/register")}
              disabled={loading}
            >
              <Text className="font-inter-medium text-sm text-secondary-foreground">
                {`Don't have an account?`}{" "}
                <Text className="font-inter-bold text-primary">Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}