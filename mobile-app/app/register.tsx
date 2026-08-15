import PrimaryButton from "@/components/ui/PrimaryButton";
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
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
              Apply as Vendor
            </Text>
            <Text className="font-inter-medium text-[15px] text-secondary-foreground">
              Join the SK-Ledge network
            </Text>
          </View>

          {/* OVERLAPPING BODY */}
          <View className="flex-1 rounded-t-[30px] bg-background px-8 pb-[60px] pt-10">
            <View className="gap-6">
              <View>
                <Text className="font-inter-bold mb-2 ml-1 text-xs uppercase tracking-[1px] text-secondary-foreground">
                  Company / Vendor Name
                </Text>
                <View className="h-14 flex-row items-center rounded-2xl border border-border bg-white px-4"
                  style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 }}
                >
                  <Briefcase size={20} color="#64748B" />
                  <TextInput
                    className="font-inter-medium ml-3 flex-1 text-base text-primary-foreground"
                    placeholder="Acme Corp"
                    placeholderTextColor="#64748B"
                    value={companyName}
                    onChangeText={setCompanyName}
                    editable={!loading}
                  />
                </View>
              </View>

              <View>
                <Text className="font-inter-bold mb-2 ml-1 text-xs uppercase tracking-[1px] text-secondary-foreground">
                  Corporate Email
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
              <PrimaryButton onPress={handleSignUp} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#1E293B" />
                ) : (
                  "Submit Application"
                )}
              </PrimaryButton>

              <TouchableOpacity
                activeOpacity={0.6}
                className="items-center py-2"
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text className="font-inter-medium text-sm text-secondary-foreground">
                  Already an SK registered vendor?{" "}
                  <Text className="font-inter-bold text-primary">Sign In</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}