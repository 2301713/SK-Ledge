import DotGrid from "@/components/ui/DotGrid";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getErrorMessage } from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
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

export default function RegisterPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!companyName.trim()) {
      errors.companyName = "Enter your registered company or vendor name.";
    }
    if (!email.trim()) {
      errors.email = "Enter your corporate email address.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = "Enter a valid email address.";
    }
    if (!password) {
      errors.password = "Create a password.";
    } else if (password.length < 8) {
      errors.password = "Use at least 8 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignUp = async () => {
    setFormError("");
    if (!validate()) return;

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            role: "vendor",
            role_type: "Vendor",
            company_name: companyName.trim(),
            full_name: companyName.trim(),
            approval_status: "pending",
          },
        },
      });

      if (signUpError) throw new Error(signUpError.message);

      if (data?.session) {
        await supabase.auth.signOut();
      }

      setSubmitted(true);
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Registration failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <StatusBar barStyle="dark-content" />
        <View className="relative flex-1 items-center justify-center overflow-hidden px-6">
          <DotGrid color="#0138A8" opacity={0.05} rows={20} />
          <Animated.View entering={FadeInDown.duration(450)} style={{ width: "100%" }}>
          <View
            className="w-full rounded-3xl border border-border bg-white p-7"
            style={{
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.06,
              shadowRadius: 24,
              elevation: 3,
            }}
          >
            <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl border border-success/20 bg-success/10">
              <CheckCircle2 size={28} color="#10B981" />
            </View>
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
              Application received
            </Text>
            <Text className="font-inter-black mt-2 text-[26px] leading-[32px] tracking-tight text-primary-foreground">
              Application submitted
            </Text>
            <Text className="font-inter mt-2 text-[13px] leading-6 text-secondary-foreground">
              Your vendor application for {companyName.trim()} is pending review
              by the SK Federation. Sign in once your account has been approved.
            </Text>

            <TouchableOpacity
              className="mt-6 flex-row items-center justify-center gap-2 rounded-xl bg-primary py-4"
              onPress={() => router.replace("/")}
              activeOpacity={0.85}
            >
              <Text className="font-inter-black text-[12px] uppercase tracking-[0.16em] text-white">
                Back to Sign In
              </Text>
              <ChevronRight size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

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
            <DotGrid color="#0138A8" opacity={0.06} rows={9} />

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

              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityLabel="Back to sign in"
                className="h-9 w-9 items-center justify-center rounded-xl border border-border bg-white"
              >
                <ArrowLeft size={17} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <View className="mt-7">
              <View className="mb-2 flex-row items-center gap-2">
                <View className="h-1 w-5 rounded-full bg-tertiary" />
                <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
                  Vendor Registration
                </Text>
              </View>
              <Text className="font-inter-black text-[28px] leading-[34px] tracking-tight text-primary-foreground">
                Apply for portal access
              </Text>
              <Text className="font-inter mt-1.5 max-w-[310px] text-[13px] leading-5 text-secondary-foreground">
                Register once, then bid on published SK procurements from
                Batangas barangays.
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
                  Vendor application
                </Text>
              </View>

              <View className="gap-4">
                <FormField
                  label="Company / Vendor Name"
                  icon={Briefcase}
                  value={companyName}
                  onChangeText={(value) => {
                    setCompanyName(value);
                    setFieldErrors((prev) => ({ ...prev, companyName: "" }));
                    setFormError("");
                  }}
                  placeholder="Acme Trading Corp."
                  error={fieldErrors.companyName}
                  editable={!loading}
                />

                <FormField
                  label="Corporate Email"
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
                  label="Secure Password"
                  icon={Lock}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setFieldErrors((prev) => ({ ...prev, password: "" }));
                    setFormError("");
                  }}
                  placeholder="At least 8 characters"
                  error={fieldErrors.password}
                  secure
                  showSecure={showPassword}
                  onToggleSecure={() => setShowPassword((value) => !value)}
                  editable={!loading}
                />
              </View>

              <View className="mt-6">
                <PrimaryButton onPress={handleSignUp} disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    "Submit Application"
                  )}
                </PrimaryButton>
              </View>

              <Text className="font-inter mt-3 text-center text-[10px] leading-4 text-secondary-foreground/80">
                Every application is reviewed by an SK Federation administrator
                before bidding is enabled.
              </Text>
            </View>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={0.6}
              className="mt-5 items-center py-2"
              onPress={() => router.back()}
              disabled={loading}
            >
              <Text className="font-inter-medium text-[13px] text-secondary-foreground">
                Already registered?{" "}
                <Text className="font-inter-bold text-primary">Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
