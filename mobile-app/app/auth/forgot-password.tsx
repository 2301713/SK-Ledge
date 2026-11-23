import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { sendPasswordResetEmail } from "@/lib/password-reset";
import { getErrorMessage } from "@/lib/projects";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Mail,
  ShieldCheck,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const handleSend = async () => {
    setError("");
    setFieldError("");

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldError("Enter the email address on your vendor account.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(trimmed);
      setSentTo(trimmed);
    } catch (err) {
      setError(getErrorMessage(err, "Could not send the reset email."));
    } finally {
      setLoading(false);
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
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View className="px-6 pt-4">
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-xl border border-border bg-white"
              activeOpacity={0.85}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Go back to sign in"
            >
              <ArrowLeft size={20} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-center px-6 pb-10 pt-8">
            <View className="mb-2 flex-row items-center gap-2">
              <View className="h-1 w-5 rounded-full bg-tertiary" />
              <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
                Vendor Authentication
              </Text>
            </View>

            {sentTo ? (
              <>
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
                  <CheckCircle2 size={26} color="#0F9D58" />
                </View>
                <Text className="font-inter-black text-[26px] leading-[32px] tracking-tight text-primary-foreground">
                  Check your email
                </Text>
                <Text className="font-inter mt-3 text-[13px] leading-6 text-secondary-foreground">
                  If a vendor account exists for{" "}
                  <Text className="font-inter-bold text-primary-foreground">
                    {sentTo}
                  </Text>
                  , we sent a link to reset its password. Open the link on this
                  device to choose a new password.
                </Text>
                <Text className="font-inter mt-3 text-[12px] leading-5 text-secondary-foreground">
                  Nothing arrived? Check spam, then request another email — the
                  link expires after one hour.
                </Text>

                <View className="mt-7 gap-3">
                  <PrimaryButton onPress={() => router.replace("/")}>
                    Back to Sign In
                  </PrimaryButton>
                  <TouchableOpacity
                    className="h-12 items-center justify-center rounded-xl border border-border bg-white"
                    activeOpacity={0.85}
                    onPress={() => {
                      setSentTo("");
                      setEmail("");
                    }}
                  >
                    <Text className="font-inter-bold text-[11px] uppercase tracking-[0.14em] text-primary">
                      Send to another email
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
                  <ShieldCheck size={26} color="#0138A8" />
                </View>
                <Text className="font-inter-black text-[26px] leading-[32px] tracking-tight text-primary-foreground">
                  Reset your password
                </Text>
                <Text className="font-inter mt-3 text-[13px] leading-6 text-secondary-foreground">
                  Enter the email on your vendor account and we will send a
                  secure link to set a new password.
                </Text>

                {error ? (
                  <View className="mt-5 flex-row items-start gap-2 rounded-xl border border-danger/25 bg-danger/[0.07] p-3">
                    <CircleAlert
                      size={15}
                      color="#DC2626"
                      style={{ marginTop: 1 }}
                    />
                    <Text className="font-inter-medium flex-1 text-[11px] leading-4 text-danger">
                      {error}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-5">
                  <FormField
                    label="Email"
                    icon={Mail}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setFieldError("");
                      setError("");
                    }}
                    placeholder="vendor@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    error={fieldError}
                  />
                </View>

                <View className="mt-5">
                  <PrimaryButton onPress={handleSend} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      "Send reset link"
                    )}
                  </PrimaryButton>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
