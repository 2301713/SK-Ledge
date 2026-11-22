import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  completePasswordResetFromUrl,
  updatePassword,
} from "@/lib/password-reset";
import { getErrorMessage } from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  CircleAlert,
  KeyRound,
  Lock,
  ShieldCheck,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Phase = "checking" | "form" | "error" | "done";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const incomingUrl = Linking.useURL();
  const checkedUrl = useRef<string | null>(null);

  const [phase, setPhase] = useState<Phase>("checking");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    const verify = async () => {
      const url = incomingUrl ?? (await Linking.getInitialURL());
      if (!url || checkedUrl.current === url) return;
      checkedUrl.current = url;

      const outcome = await completePasswordResetFromUrl(url);
      if (!active) return;

      if (outcome.status === "ready") {
        setPhase("form");
      } else {
        setError(outcome.message);
        setPhase("error");
      }
    };

    verify();

    return () => {
      active = false;
    };
  }, [incomingUrl]);

  const handleSave = async () => {
    setPasswordError("");
    setConfirmError("");

    if (password.length < 8) {
      setPasswordError("Use at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      // Drop the recovery session so the vendor signs in deliberately with the
      // new password instead of landing in the dashboard mid-flow.
      await supabase.auth.signOut();
      setPhase("done");
    } catch (err) {
      setPasswordError(
        getErrorMessage(err, "Could not update your password."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View className="flex-1 justify-center px-6 py-10">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-1 w-5 rounded-full bg-tertiary" />
              <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
                Vendor Authentication
              </Text>
            </View>

            {phase === "checking" ? (
              <>
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
                  <ShieldCheck size={26} color="#0138A8" />
                </View>
                <Text className="font-inter-black text-[26px] leading-[32px] tracking-tight text-primary-foreground">
                  Verifying your reset link
                </Text>
                <View className="mt-6 flex-row items-center gap-2.5">
                  <ActivityIndicator color="#0138A8" />
                  <Text className="font-inter-semibold text-[11px] uppercase tracking-[0.14em] text-secondary-foreground">
                    One moment…
                  </Text>
                </View>
              </>
            ) : null}

            {phase === "error" ? (
              <>
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
                  <CircleAlert size={26} color="#DC2626" />
                </View>
                <Text className="font-inter-black text-[26px] leading-[32px] tracking-tight text-primary-foreground">
                  This link no longer works
                </Text>
                <Text className="font-inter mt-3 text-[13px] leading-6 text-secondary-foreground">
                  {error}
                </Text>
                <View className="mt-7 gap-3">
                  <PrimaryButton
                    onPress={() => router.replace("/auth/forgot-password")}
                  >
                    Request a new link
                  </PrimaryButton>
                  <TouchableOpacity
                    className="h-12 items-center justify-center rounded-xl border border-border bg-white"
                    activeOpacity={0.85}
                    onPress={() => router.replace("/")}
                    accessibilityRole="button"
                    accessibilityLabel="Back to sign in"
                  >
                    <Text className="font-inter-bold text-[11px] uppercase tracking-[0.14em] text-primary">
                      Back to Sign In
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : null}

            {phase === "form" ? (
              <>
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
                  <KeyRound size={26} color="#0138A8" />
                </View>
                <Text className="font-inter-black text-[26px] leading-[32px] tracking-tight text-primary-foreground">
                  Choose a new password
                </Text>
                <Text className="font-inter mt-3 text-[13px] leading-6 text-secondary-foreground">
                  Use at least 8 characters. You will sign in again with this
                  password.
                </Text>

                <View className="mt-6 gap-4">
                  <FormField
                    label="New password"
                    icon={Lock}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      setPasswordError("");
                    }}
                    placeholder="At least 8 characters"
                    secure
                    showSecure={showPassword}
                    onToggleSecure={() =>
                      setShowPassword((current) => !current)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!saving}
                    error={passwordError}
                  />
                  <FormField
                    label="Confirm password"
                    icon={Lock}
                    value={confirmPassword}
                    onChangeText={(value) => {
                      setConfirmPassword(value);
                      setConfirmError("");
                    }}
                    placeholder="Repeat your new password"
                    secure
                    showSecure={showPassword}
                    onToggleSecure={() =>
                      setShowPassword((current) => !current)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!saving}
                    error={confirmError}
                  />
                </View>

                <View className="mt-6">
                  <PrimaryButton onPress={handleSave} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      "Save new password"
                    )}
                  </PrimaryButton>
                </View>
              </>
            ) : null}

            {phase === "done" ? (
              <>
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
                  <CheckCircle2 size={26} color="#0F9D58" />
                </View>
                <Text className="font-inter-black text-[26px] leading-[32px] tracking-tight text-primary-foreground">
                  Password updated
                </Text>
                <Text className="font-inter mt-3 text-[13px] leading-6 text-secondary-foreground">
                  Sign in with your new password to continue managing your
                  vendor account.
                </Text>
                <View className="mt-7">
                  <PrimaryButton onPress={() => router.replace("/")}>
                    Go to Sign In
                  </PrimaryButton>
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
