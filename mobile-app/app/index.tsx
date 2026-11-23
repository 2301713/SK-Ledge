import DotGrid from "@/components/ui/DotGrid";
import FormField from "@/components/ui/FormField";
import GoogleButton from "@/components/ui/GoogleButton";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  isPasswordLoginEnabled,
  signInWithEmailPassword,
} from "@/lib/email-auth";
import { getGoogleRedirectUrl, signInWithGoogle } from "@/lib/google-auth";
import { getErrorMessage } from "@/lib/projects";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  CircleAlert,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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

export default function IndexPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [passwordEmail, setPasswordEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordFieldError, setPasswordFieldError] = useState("");
  const redirectUrl = getGoogleRedirectUrl();

  useEffect(() => {
    if (__DEV__) {
      console.log("[auth] OAuth redirect URL:", redirectUrl);
    }
  }, [redirectUrl]);

  const handleGoogleSignIn = async () => {
    setFormError("");
    setLoading(true);

    try {
      const outcome = await signInWithGoogle();

      if (outcome.status === "cancelled") return;
      if (outcome.status === "approved") {
        router.replace("/(tabs)/home");
        return;
      }
      if (outcome.status === "incomplete") {
        router.replace("/auth/complete-profile");
        return;
      }

      setFormError(outcome.message);
    } catch (err) {
      setFormError(
        getErrorMessage(err, "Google sign-in failed. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async () => {
    setPasswordError("");
    setPasswordFieldError("");

    if (!passwordEmail.trim() || !password) {
      setPasswordFieldError("Enter both your email and password.");
      return;
    }

    setPasswordLoading(true);

    try {
      const outcome = await signInWithEmailPassword(passwordEmail, password);

      if (outcome.status === "cancelled") return;
      if (outcome.status === "approved") {
        router.replace("/(tabs)/home");
        return;
      }
      if (outcome.status === "incomplete") {
        router.replace("/auth/complete-profile");
        return;
      }

      setPasswordError(outcome.message);
    } catch (err) {
      setPasswordError(
        getErrorMessage(err, "Email sign-in failed. Please try again."),
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
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
                Sign in with the Google account linked to your approved vendor
                registration to open your procurement workspace.
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* SIGN IN */}
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

              <Text className="font-inter-bold text-[16px] tracking-tight text-primary-foreground">
                Continue with your Google account
              </Text>
              <Text className="font-inter mt-1.5 text-[12px] leading-5 text-secondary-foreground">
                {isPasswordLoginEnabled
                  ? "Use the Google account linked to your approved vendor registration, or the temporary email login below."
                  : "SK-Ledge mobile uses Google sign-in only. Password login is not available in the app."}
              </Text>

              <View className="mt-5">
                <GoogleButton onPress={handleGoogleSignIn} loading={loading} />
              </View>

              {__DEV__ ? (
                <View className="mt-4 rounded-xl border border-dashed border-border bg-secondary/40 p-3">
                  <Text className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground">
                    Dev only · OAuth redirect URL
                  </Text>
                  <Text
                    selectable
                    className="font-inter-medium mt-1 text-[10px] leading-4 text-primary"
                  >
                    {redirectUrl}
                  </Text>
                  <Text className="font-inter mt-1 text-[9px] leading-4 text-secondary-foreground">
                    Add this exact URL to Supabase → Authentication → URL
                    Configuration → Redirect URLs.
                  </Text>
                </View>
              ) : null}

              <View className="mt-4 flex-row items-center justify-center gap-1.5">
                <Lock size={11} color="#94A3B8" />
                <Text className="font-inter-semibold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground/70">
                  Approved vendors only · Secure Google OAuth
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* TEMPORARY EMAIL LOGIN (testing only) */}
          {isPasswordLoginEnabled ? (
            <Animated.View entering={FadeInDown.delay(160).duration(450)}>
              <View className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.03] p-4">
                <View className="mb-1 flex-row items-center justify-between gap-2">
                  <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-primary">
                    Temporary testing login
                  </Text>
                  <View className="rounded-full bg-primary/10 px-2 py-0.5">
                    <Text className="font-inter-bold text-[8px] uppercase tracking-[0.12em] text-primary">
                      Dev only
                    </Text>
                  </View>
                </View>
                <Text className="font-inter text-[10px] leading-4 text-secondary-foreground">
                  Sign in with an existing Supabase Auth email/password account
                  to test the app without Google OAuth.
                </Text>

                {passwordError ? (
                  <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-danger/25 bg-danger/[0.07] p-3">
                    <CircleAlert
                      size={15}
                      color="#DC2626"
                      style={{ marginTop: 1 }}
                    />
                    <Text className="font-inter-medium flex-1 text-[11px] leading-4 text-danger">
                      {passwordError}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-3 gap-3">
                  <FormField
                    label="Email"
                    icon={Mail}
                    value={passwordEmail}
                    onChangeText={(value) => {
                      setPasswordEmail(value);
                      setPasswordFieldError("");
                      setPasswordError("");
                    }}
                    placeholder="vendor@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!passwordLoading}
                  />

                  <FormField
                    label="Password"
                    icon={Lock}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setPasswordFieldError("");
                      setPasswordError("");
                    }}
                    placeholder="Enter your password"
                    secure
                    showSecure={showPassword}
                    onToggleSecure={() => setShowPassword((current) => !current)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!passwordLoading}
                    error={passwordFieldError}
                  />
                </View>

                <View className="mt-4">
                  <PrimaryButton
                    onPress={handlePasswordSignIn}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      "Sign in with email"
                    )}
                  </PrimaryButton>
                </View>

                <TouchableOpacity
                  className="mt-3 items-center justify-center py-1"
                  activeOpacity={0.7}
                  onPress={() => router.push("/auth/forgot-password")}
                  disabled={passwordLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Forgot your password?"
                >
                  <Text className="font-inter-bold text-[10px] uppercase tracking-[0.12em] text-primary">
                    Forgot your password?
                  </Text>
                </TouchableOpacity>

                <Text className="font-inter mt-2.5 text-center text-[9px] leading-4 text-secondary-foreground/70">
                  The account must already have a vendor profile in Supabase.
                </Text>
              </View>
            </Animated.View>
          ) : null}

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
