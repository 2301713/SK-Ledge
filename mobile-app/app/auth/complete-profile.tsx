import DotGrid from "@/components/ui/DotGrid";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import { getErrorMessage } from "@/lib/projects";
import { registerPushToken } from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import {
  Briefcase,
  CircleAlert,
  Mail,
  Phone,
  ShieldCheck,
  User,
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const normalizeContactNumber = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "");
  if (/^639[0-9]{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9[0-9]{9}$/.test(digits)) return `0${digits}`;
  return digits;
};

export default function CompleteVendorProfileScreen() {
  const router = useRouter();
  const [registeredName, setRegisteredName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data: { user } }) => {
        if (!active) return;

        if (!user) {
          setError(
            "We could not load your account session. Please return to sign in and try again.",
          );
          return;
        }

        setEmail(user.email ?? "");

        const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
        const suggested =
          typeof metadata.full_name === "string"
            ? metadata.full_name
            : typeof metadata.name === "string"
              ? metadata.name
              : "";

        if (suggested && !suggested.includes("@")) {
          setRegisteredName(suggested);
        }
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Could not load your account."));
        }
      })
      .finally(() => {
        if (active) setLoadingUser(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    setError("");
    setFieldError("");
    setCompanyError("");
    setContactError("");

    const name = registeredName.trim();
    if (name.length < 2) {
      setFieldError("Enter your registered name (at least 2 characters).");
      return;
    }
    if (name.length > 120) {
      setFieldError("Use 120 characters or fewer.");
      return;
    }

    const company = companyName.trim();
    if (company.length < 2) {
      setCompanyError("Enter your company or vendor name.");
      return;
    }
    if (company.length > 120) {
      setCompanyError("Use 120 characters or fewer.");
      return;
    }

    const contact = normalizeContactNumber(contactNumber);
    if (!/^09[0-9]{9}$/.test(contact)) {
      setContactError("Enter a valid PH mobile number, e.g. 0917 123 4567.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your session expired. Please return to sign in and try again.",
        );
      }

      const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
      const avatarUrl =
        typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        full_name: name,
        company_name: company,
        contact_number: contact,
        role_type: "Vendor",
        barangay: "N/A",
        approval_status: "pending",
        avatar_url: avatarUrl,
      });

      if (insertError) {
        if (insertError.code !== "23505") {
          throw new Error(insertError.message);
        }

        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            full_name: name,
            company_name: company,
            contact_number: contact,
            avatar_url: avatarUrl,
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

      // Register before signing out so the applicant can be notified when the
      // SK Federation approves or rejects this application.
      await registerPushToken().catch(() => {
        // Push opt-in is best-effort; the application still succeeds.
      });

      await supabase.auth.signOut();
      router.replace({
        pathname: "/register",
        params: { submitted: "1", company },
      });
    } catch (err) {
      setError(
        getErrorMessage(err, "Could not submit your vendor application."),
      );
    } finally {
      setSaving(false);
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
          keyboardShouldPersistTaps="always"
        >
          <View className="relative overflow-hidden border-b border-border bg-white px-6 pb-7 pt-3">
            <DotGrid color="#0138A8" opacity={0.06} rows={9} />

            <Animated.View entering={FadeIn.duration(400)}>
              <View className="flex-row items-center gap-2.5">
                <View className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-white">
                  <Image
                    source={require("../../assets/images/skledge-logo.png")}
                    style={{ width: 28, height: 28 }}
                    resizeMode="contain"
                  />
                </View>
                <View>
                  <Text className="font-inter-black text-[15px] leading-none tracking-tight text-primary-foreground">
                    SK-Ledge
                  </Text>
                  <Text className="font-inter-bold mt-1.5 text-[8px] uppercase tracking-[0.26em] text-primary">
                    Vendor Registration
                  </Text>
                </View>
              </View>

              <View className="mt-7">
                <View className="mb-2 flex-row items-center gap-2">
                  <View className="h-1 w-5 rounded-full bg-tertiary" />
                  <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
                    One last step
                  </Text>
                </View>
                <Text className="font-inter-black text-[28px] leading-[34px] tracking-tight text-primary-foreground">
                  Complete your vendor profile
                </Text>
                <Text className="font-inter mt-1.5 max-w-[320px] text-[13px] leading-5 text-secondary-foreground">
                  Your account is connected. Confirm your registered name and
                  the company name that should appear on your SK-Ledge bids.
                </Text>
              </View>
            </Animated.View>
          </View>

          <View className="flex-1 bg-background px-6 pb-10 pt-6">
            {error ? (
              <View className="mb-5 flex-row items-start gap-3 rounded-xl border border-danger/25 bg-danger/[0.07] p-4">
                <CircleAlert
                  size={18}
                  color="#DC2626"
                  style={{ marginTop: 1 }}
                />
                <Text className="font-inter-medium flex-1 text-[12px] leading-5 text-danger">
                  {error}
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
                    label="Registered Name"
                    icon={User}
                    value={registeredName}
                    onChangeText={(value) => {
                      setRegisteredName(value);
                      setFieldError("");
                      setError("");
                    }}
                    placeholder="Juan Dela Cruz"
                    error={fieldError}
                    autoCapitalize="words"
                    editable={!saving && !loadingUser}
                  />

                  <FormField
                    label="Company / Vendor Name"
                    icon={Briefcase}
                    value={companyName}
                    onChangeText={(value) => {
                      setCompanyName(value);
                      setCompanyError("");
                      setError("");
                    }}
                    placeholder="Acme Trading Corp."
                    error={companyError}
                    autoCapitalize="words"
                    editable={!saving && !loadingUser}
                  />

                  <FormField
                    label="Contact Number"
                    icon={Phone}
                    value={contactNumber}
                    onChangeText={(value) => {
                      setContactNumber(value);
                      setContactError("");
                      setError("");
                    }}
                    placeholder="0917 123 4567"
                    keyboardType="phone-pad"
                    error={contactError}
                    autoCapitalize="none"
                    editable={!saving && !loadingUser}
                  />

                  <View>
                    <Text className="font-inter-bold mb-2 ml-0.5 text-[10px] uppercase tracking-[0.16em] text-secondary-foreground">
                      Account Email
                    </Text>
                    <View className="h-[52px] flex-row items-center rounded-xl border border-border bg-secondary/50 px-4">
                      <Mail size={17} color="#94A3B8" />
                      <Text
                        className="font-inter-medium ml-3 flex-1 text-[15px] text-secondary-foreground"
                        numberOfLines={1}
                      >
                        {loadingUser ? "Loading…" : email || "Not available"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View className="mt-6">
                  <PrimaryButton
                    onPress={handleSubmit}
                    disabled={saving || loadingUser}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      "Submit Vendor Application"
                    )}
                  </PrimaryButton>
                </View>

                <Text className="font-inter mt-3 text-center text-[10px] leading-4 text-secondary-foreground/80">
                  Signing up always creates a Vendor account. The SK Federation
                  reviews every application before bidding is enabled.
                </Text>
              </View>
            </Animated.View>

            {loadingUser ? (
              <View className="mt-5 flex-row items-center justify-center gap-2">
                <ActivityIndicator color="#0138A8" />
                <Text className="font-inter-semibold text-[10px] uppercase tracking-[0.14em] text-secondary-foreground">
                  Checking your account session…
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
