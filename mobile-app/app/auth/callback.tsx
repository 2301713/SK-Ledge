import DotGrid from "@/components/ui/DotGrid";
import PrimaryButton from "@/components/ui/PrimaryButton";
import {
  completeGoogleCode,
  type VendorAuthOutcome,
} from "@/lib/google-auth";
import { getErrorMessage } from "@/lib/projects";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CircleAlert, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string | string[];
    error?: string | string[];
    error_description?: string | string[];
  }>();
  const started = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let active = true;

    const finish = async () => {
      const providerError = first(params.error);
      const providerDescription = first(params.error_description);

      if (providerError) {
        setError(
          providerError === "access_denied"
            ? "Google sign-in was cancelled."
            : (providerDescription ?? providerError),
        );
        return;
      }

      const code = first(params.code);
      if (!code) {
        setError("Google did not return an authorization code. Please try again.");
        return;
      }

      let outcome: VendorAuthOutcome;
      try {
        outcome = await completeGoogleCode(code);
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err, "Google sign-in failed. Please try again."));
        }
        return;
      }

      if (!active) return;

      if (outcome.status === "approved") {
        router.replace("/(tabs)/home");
      } else if (outcome.status === "incomplete") {
        router.replace("/auth/complete-profile");
      } else if (outcome.status === "error") {
        setError(outcome.message);
      } else {
        setError("Google sign-in was cancelled.");
      }
    };

    finish();

    return () => {
      active = false;
    };
  }, [params.code, params.error, params.error_description, router]);


  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="relative flex-1 items-center justify-center overflow-hidden px-6">
        <DotGrid color="#0138A8" opacity={0.05} rows={20} />

        <View className="w-full max-w-md rounded-3xl border border-border bg-white p-7">
          <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white">
            <Image
              source={require("../../assets/images/skledge-logo.png")}
              style={{ width: 34, height: 34 }}
              resizeMode="contain"
            />
          </View>

          {error ? (
            <>
              <View className="mb-2 flex-row items-center gap-2">
                <CircleAlert size={14} color="#DC2626" />
                <Text className="font-inter-bold text-[10px] uppercase tracking-[0.18em] text-danger">
                  Google sign-in
                </Text>
              </View>
              <Text className="font-inter-black text-[24px] leading-[30px] tracking-tight text-primary-foreground">
                We could not finish signing you in
              </Text>
              <Text className="font-inter mt-2 text-[13px] leading-6 text-secondary-foreground">
                {error}
              </Text>

              <View className="mt-6">
                <PrimaryButton onPress={() => router.replace("/")}>
                  Back to Sign In
                </PrimaryButton>
              </View>
            </>
          ) : (
            <>
              <View className="mb-2 flex-row items-center gap-2">
                <ShieldCheck size={14} color="#0138A8" />
                <Text className="font-inter-bold text-[10px] uppercase tracking-[0.18em] text-primary">
                  Secure Google sign-in
                </Text>
              </View>
              <Text className="font-inter-black text-[24px] leading-[30px] tracking-tight text-primary-foreground">
                Verifying your vendor account
              </Text>
              <Text className="font-inter mt-2 text-[13px] leading-6 text-secondary-foreground">
                Hold on while we confirm your Google account and check that it
                belongs to an approved SK-Ledge vendor.
              </Text>

              <View className="mt-6 flex-row items-center gap-2.5">
                <ActivityIndicator color="#0138A8" />
                <Text className="font-inter-semibold text-[11px] uppercase tracking-[0.14em] text-secondary-foreground">
                  Connecting…
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
