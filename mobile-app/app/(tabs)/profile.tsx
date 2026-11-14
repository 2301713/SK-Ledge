import ScreenHeader from "@/components/ui/ScreenHeader";
import { ProfileDetailsSkeleton } from "@/components/ui/Skeletons";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  fetchMyProfile,
  getErrorMessage,
  type VendorProfile,
} from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  LogOut,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DetailRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <View className="flex-row items-center border-b border-border/70 py-3 last:border-b-0">
    <View className="mr-3 h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary">
      <Icon size={15} color="#0138A8" />
    </View>
    <View className="flex-1">
      <Text className="font-inter-bold text-[9px] uppercase tracking-[0.12em] text-secondary-foreground">
        {label}
      </Text>
      <Text
        className="font-inter-semibold mt-1 text-[13px] text-primary-foreground"
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  </View>
);

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [email, setEmail] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session expired. Please sign in again.");
        return;
      }

      setEmail(user.email ?? "");
      setProfile(await fetchMyProfile(user.id));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your profile."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        if (!data.user) {
          setError("Your session expired. Please sign in again.");
          return;
        }
        setEmail(data.user.email ?? "");
        return fetchMyProfile(data.user.id).then((loadedProfile) => {
          if (active) setProfile(loadedProfile);
        });
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Could not load your profile."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = () => {
    Alert.alert("Log out?", "You will need to sign in again to view your bids.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          const { error: signOutError } = await supabase.auth.signOut();
          setSigningOut(false);
          if (signOutError) {
            Alert.alert("Logout Failed", signOutError.message);
          }
        },
      },
    ]);
  };

  const companyName =
    profile?.full_name || email.split("@")[0] || "Vendor account";
  const approvalStatus = profile?.approval_status ?? "pending";
  const isApproved = approvalStatus.toLowerCase() === "approved";

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="bg-white" edges={["top"]} />

      <Animated.View entering={FadeIn.duration(350)}>
      <ScreenHeader
        eyebrow="Vendor Account"
        title={loading ? "Loading..." : companyName}
        subtitle={profile?.email || email || "Registered vendor"}
        right={
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Text className="font-inter-black text-[20px] text-white">
              {companyName.charAt(0).toUpperCase()}
            </Text>
            {isApproved ? (
              <View className="absolute -bottom-0.5 -right-0.5 h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-success">
                <ShieldCheck size={8} color="#FFFFFF" />
              </View>
            ) : null}
          </View>
        }
      />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#0138A8"
            onRefresh={() => {
              setError("");
              setRefreshing(true);
              loadProfile();
            }}
          />
        }
      >
        <View className="px-6 pt-5">
          {error ? (
            <View className="mb-5 rounded-xl border border-danger/25 bg-danger/[0.06] p-4">
              <Text className="font-inter-semibold text-[12px] leading-5 text-danger">
                {error}
              </Text>
            </View>
          ) : null}

          {loading ? (
            <ProfileDetailsSkeleton />
          ) : (
            <Animated.View entering={FadeInDown.delay(60).duration(420)}>
              {/* ACCOUNT DETAILS */}
              <View className="rounded-2xl border border-border bg-white p-4">
                <View className="mb-1 flex-row items-center justify-between gap-3 border-b border-border/70 pb-3.5">
                  <View className="flex-1">
                    <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-primary">
                      Account details
                    </Text>
                    <Text className="font-inter-bold mt-1 text-[15px] tracking-tight text-primary-foreground">
                      Registered vendor information
                    </Text>
                  </View>
                  <View className="h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-secondary">
                    <Building2 size={16} color="#0138A8" />
                  </View>
                </View>

                <DetailRow
                  icon={Building2}
                  label="Registered name"
                  value={companyName}
                />
                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={profile?.email || email || "Not set"}
                />
                <DetailRow
                  icon={MapPin}
                  label="Barangay"
                  value={
                    profile?.barangay && profile.barangay !== "N/A"
                      ? profile.barangay
                      : "Not assigned"
                  }
                />
                <DetailRow
                  icon={ShieldCheck}
                  label="Account type"
                  value={profile?.role_type || "Vendor"}
                />
              </View>

              {/* VERIFICATION */}
              <View
                className={`mt-4 rounded-2xl border p-4 ${
                  isApproved
                    ? "border-success/20 bg-success/[0.05]"
                    : "border-pending/20 bg-pending/[0.06]"
                }`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <View className="mb-2 flex-row items-center gap-1.5">
                      <ShieldCheck
                        size={13}
                        color={isApproved ? "#10B981" : "#D97706"}
                      />
                      <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-secondary-foreground">
                        Vendor verification
                      </Text>
                    </View>
                    <Text className="font-inter-bold text-[15px] tracking-tight text-primary-foreground">
                      {isApproved ? "Account approved" : "Review in progress"}
                    </Text>
                    <Text className="font-inter mt-1 text-[11px] leading-[17px] text-secondary-foreground">
                      {isApproved
                        ? "Your vendor account is approved. You can submit bids on open procurements."
                        : "Your application is still under review by the SK Federation. Bidding unlocks once approved."}
                    </Text>
                  </View>
                  <StatusBadge
                    status={isApproved ? "approved" : approvalStatus}
                    showDot
                  />
                </View>
              </View>

              {/* LOGOUT */}
              <TouchableOpacity
                className="mt-6 flex-row items-center justify-center gap-2.5 rounded-xl border border-danger/20 bg-white py-3.5"
                onPress={handleLogout}
                disabled={signingOut}
                activeOpacity={0.75}
              >
                {signingOut ? (
                  <ActivityIndicator color="#DC2626" />
                ) : (
                  <>
                    <LogOut size={15} color="#DC2626" />
                    <Text className="font-inter-bold text-[11px] uppercase tracking-[0.12em] text-danger">
                      Log out
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text className="font-inter-semibold mt-6 text-center text-[9px] uppercase tracking-[0.18em] text-secondary-foreground/60">
                SK-Ledge · Vendor Portal · v1.0.0
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
