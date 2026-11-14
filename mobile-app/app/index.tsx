import DotGrid from "@/components/ui/DotGrid";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { fetchMyProfile, getErrorMessage } from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  CircleAlert,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function IndexPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Enter your registered email address.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Enter your password.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignIn = async () => {
    setFormError("");
    if (!validate()) return;

    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (authError) {
        throw new Error(authError.message || "Invalid email or password.");
      }

      if (!authData.user) {
        throw new Error("Sign in did not return an account. Please try again.");
      }

      const profile = await fetchMyProfile(authData.user.id);

      if (!profile) {
        await supabase.auth.signOut();
        setFormError(
          "Your vendor profile is not linked to this account. Contact the SK Federation for assistance.",
        );
        return;
      }

      if ((profile.role_type ?? "").toLowerCase() !== "vendor") {
        await supabase.auth.signOut();
        setFormError(
          "This account is not a mobile vendor account. Please use the web portal instead.",
        );
        return;
      }

      const status = (profile.approval_status ?? "pending").toLowerCase();
      if (status === "pending") {
        await supabase.auth.signOut();
        setFormError(
          "Your vendor application is still under review by the SK Federation. You can sign in once it is approved.",
        );
        return;
      }

      if (status === "rejected") {
        await supabase.auth.signOut();
        setFormError(
          "Your vendor application was not approved. Contact the SK Federation for more information.",
        );
        return;
      }

      router.replace("/(tabs)/home");
    } catch (err) {
      setFormError(getErrorMessage(err, "Invalid login credentials."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" />
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
          {/* BRAND HEADER */}
          <View className="relative overflow-hidden border-b border-border bg-white px-6 pb-7 pt-3">
            <DotGrid color="#0138A8" opacity={0.06} rows={8} />

            <Animated.View entering={FadeIn.duration(400)}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <View className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-white">
                  <Image
                    source={require("../assets/images/skledge-logo.png")}
                    style={{ width: 28, height: 28 }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="font-inter-black text-[15px] leading-none tracking-tight text-primary-foreground">
                    SK-Ledge
                  </Text>
                  <Text className="font-inter-bold mt-1.5 text-[8px] uppercase tracking-[0.26em] text-primary">
                    Official System Portal
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1">
                <View className="h-1.5 w-1.5 rounded-full bg-tertiary" />
                <Text className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground">
                  Batangas
                </Text>
              </View>
            </View>

            <View className="mt-7">
              <View className="mb-2 flex-row items-center gap-2">
                <View className="h-1 w-5 rounded-full bg-tertiary" />
                <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
                  Vendor Authentication
                </Text>
              </View>
              <Text className="font-inter-black text-[30px] leading-[36px] tracking-tight text-primary-foreground">
                Welcome back
              </Text>
              <Text className="font-inter mt-1.5 max-w-[310px] text-[13px] leading-5 text-secondary-foreground">
                Sign in with the vendor account approved by your SK Federation to
                open your procurement workspace.
              </Text>
            </View>
            </Animated.View>
          </View>

          {/* FORM */}
          <View className="flex-1 bg-background px-6 pb-10 pt-6">
            {formError ? (
              <View className="mb-5 flex-row items-start gap-3 rounded-xl border border-danger/25 bg-danger/[0.07] p-4">
                <CircleAlert size={18} color="#DC2626" style={{ marginTop: 1 }} />
                <Text className="font-inter-medium flex-1 text-[12px] leading-5 text-danger">
                  {formError}
                </Text>
              </View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(120).duration(450)}>
            <View
              className="rounded-3xl border border-border bg-white p-5"
              style={{
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 24,
                elevation: 3,
              }}
            >
              <View className="mb-5 flex-row items-center gap-2">
                <ShieldCheck size={14} color="#0138A8" />
                <Text className="font-inter-bold text-[10px] uppercase tracking-[0.18em] text-secondary-foreground">
                  Secure vendor sign in
                </Text>
              </View>

              <View className="gap-4">
                <FormField
                  label="Email Address"
                  icon={Mail}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                    setFormError("");
                  }}
                  placeholder="vendor@company.com"
                  error={fieldErrors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <FormField
                  label="Password"
                  icon={Lock}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setFieldErrors((prev) => ({ ...prev, password: "" }));
                    setFormError("");
                  }}
                  placeholder="••••••••"
                  error={fieldErrors.password}
                  secure
                  showSecure={showPassword}
                  onToggleSecure={() => setShowPassword((value) => !value)}
                  editable={!loading}
                />
              </View>

              <View className="mt-6">
                <PrimaryButton onPress={handleSignIn} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    "Access Portal"
                  )}
                </PrimaryButton>
              </View>

              <View className="mt-4 flex-row items-center justify-center gap-1.5">
                <Lock size={11} color="#94A3B8" />
                <Text className="font-inter-semibold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground/70">
                  Authorized vendors only · Secure session
                </Text>
              </View>
            </View>
            </Animated.View>

            {/* REGISTER PROMPT */}
            <Animated.View entering={FadeInDown.delay(200).duration(450)}>
            <View className="mt-4 rounded-2xl border border-border bg-secondary/40 p-4">
              <View className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-secondary-foreground">
                    New to the portal
                  </Text>
                  <Text className="font-inter-bold mt-1 text-[15px] tracking-tight text-primary-foreground">
                    Apply as a vendor
                  </Text>
                </View>
                <TouchableOpacity
                  className="flex-row items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5"
                  activeOpacity={0.85}
                  onPress={() => router.push("/register")}
                  disabled={loading}
                >
                  <Text className="font-inter-bold text-[11px] uppercase tracking-[0.08em] text-white">
                    Sign Up
                  </Text>
                  <ChevronRight size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            </Animated.View>

            <Text className="font-inter-semibold mt-7 text-center text-[9px] uppercase tracking-[0.18em] text-secondary-foreground/60">
              © {new Date().getFullYear()} SK-Ledge · Batangas Province
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
