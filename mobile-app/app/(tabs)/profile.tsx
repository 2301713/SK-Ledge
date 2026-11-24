import { canonicalizeBarangay } from "@/lib/batangasBarangays";
import BarangayPicker from "@/components/ui/BarangayPicker";
import FormField from "@/components/ui/FormField";
import PrimaryButton from "@/components/ui/PrimaryButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { ProfileDetailsSkeleton } from "@/components/ui/Skeletons";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  fetchMyProfile,
  getErrorMessage,
  updateVendorProfile,
  type VendorProfile,
} from "@/lib/projects";
import { pickAvatarImage, uploadAvatar } from "@/lib/profile-media";
import { unregisterPushToken } from "@/lib/push-notifications";
import { supabase } from "@/lib/supabase";
import {
  Building2,
  Camera,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
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
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [email, setEmail] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [companyDraft, setCompanyDraft] = useState("");
  const [contactDraft, setContactDraft] = useState("");
  const [barangayDraft, setBarangayDraft] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    company?: string;
    contact?: string;
    barangay?: string;
  }>({});
  const [avatarSaving, setAvatarSaving] = useState(false);

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
          await unregisterPushToken();
          const { error: signOutError } = await supabase.auth.signOut();
          setSigningOut(false);
          if (signOutError) {
            Alert.alert("Logout Failed", signOutError.message);
          }
        },
      },
    ]);
  };

  const startEditing = () => {
    setNameDraft(profile?.full_name ?? "");
    setCompanyDraft(profile?.company_name ?? "");
    setContactDraft(profile?.contact_number ?? "");
    setBarangayDraft(
      profile?.barangay && profile.barangay !== "N/A"
        ? (canonicalizeBarangay(profile.barangay) ?? profile.barangay)
        : "",
    );
    setFieldErrors({});
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setFieldErrors({});
    setError("");
  };

  const validateDraft = () => {
    const next: typeof fieldErrors = {};
    const name = nameDraft.trim();
    const company = companyDraft.trim();
    const contact = contactDraft.trim();
    const barangay = barangayDraft.trim();

    if (name.length < 2) {
      next.name = "Enter your registered name.";
    } else if (name.length > 120) {
      next.name = "Use 120 characters or fewer.";
    }

    if (company.length < 2) {
      next.company = "Enter your company or vendor name.";
    } else if (company.length > 120) {
      next.company = "Use 120 characters or fewer.";
    }

    if (contact) {
      const digits = contact.replace(/[^0-9]/g, "");
      let normalized = digits;

      if (/^639[0-9]{9}$/.test(digits)) {
        normalized = `0${digits.slice(2)}`;
      } else if (/^9[0-9]{9}$/.test(digits)) {
        normalized = `0${digits}`;
      }

      if (!/^09[0-9]{9}$/.test(normalized)) {
        next.contact = "Enter a valid PH mobile number, e.g. 0917 123 4567.";
      }
    }

    if (barangay.length > 80) {
      next.barangay = "Use 80 characters or fewer.";
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!validateDraft()) return;

    setSaving(true);

    try {
      const updated = await updateVendorProfile({
        fullName: nameDraft.trim(),
        companyName: companyDraft.trim(),
        contactNumber: contactDraft.trim(),
        barangay: barangayDraft.trim(),
      });

      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update your profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleChangeAvatar = async () => {
    setError("");
    setSuccess("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    const picked = await pickAvatarImage();
    if (picked.status === "cancelled") return;
    if (picked.status === "error") {
      setError(picked.message);
      return;
    }

    setAvatarSaving(true);
    try {
      const url = await uploadAvatar(user.id, picked.avatar);
      setProfile((prev) => (prev ? { ...prev, avatar_url: url } : prev));
      setSuccess("Profile photo updated.");
    } catch (err) {
      setError(getErrorMessage(err, "Could not update your photo."));
    } finally {
      setAvatarSaving(false);
    }
  };

  const companyName =
    profile?.company_name ||
    profile?.full_name ||
    email.split("@")[0] ||
    "Vendor account";
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
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-primary"
            activeOpacity={0.85}
            onPress={handleChangeAvatar}
            disabled={avatarSaving}
            accessibilityRole="button"
            accessibilityLabel={
              profile?.avatar_url
                ? "Change profile photo"
                : "Add a profile photo"
            }
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: 48, height: 48 }}
                resizeMode="cover"
              />
            ) : (
              <Text className="font-inter-black text-[20px] text-white">
                {companyName.charAt(0).toUpperCase()}
              </Text>
            )}
            {avatarSaving ? (
              <View className="absolute inset-0 items-center justify-center bg-black/35">
                <ActivityIndicator color="#FFFFFF" />
              </View>
            ) : (
              <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-primary">
                <Camera size={9} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        }
      />
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
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

          {success ? (
            <View className="mb-5 flex-row items-start gap-3 rounded-xl border border-success/25 bg-success/[0.07] p-4">
              <ShieldCheck size={18} color="#10B981" style={{ marginTop: 1 }} />
              <Text className="font-inter-semibold flex-1 text-[12px] leading-5 text-primary-foreground">
                {success}
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

                {editing ? (
                  <View className="gap-4 pt-1">
                    <FormField
                      label="Registered Name"
                      icon={User}
                      value={nameDraft}
                      onChangeText={setNameDraft}
                      placeholder="Juan Dela Cruz"
                      error={fieldErrors.name}
                      autoCapitalize="words"
                      editable={!saving}
                    />
                    <FormField
                      label="Company / Vendor Name"
                      icon={Building2}
                      value={companyDraft}
                      onChangeText={setCompanyDraft}
                      placeholder="Acme Trading Corp."
                      error={fieldErrors.company}
                      autoCapitalize="words"
                      editable={!saving}
                    />
                    <FormField
                      label="Contact Number"
                      icon={Phone}
                      value={contactDraft}
                      onChangeText={setContactDraft}
                      placeholder="0917 123 4567"
                      keyboardType="phone-pad"
                      error={fieldErrors.contact}
                      autoCapitalize="none"
                      editable={!saving}
                    />
                    <BarangayPicker
                      value={barangayDraft}
                      onChange={setBarangayDraft}
                      error={fieldErrors.barangay}
                      disabled={saving}
                    />
                    <Text className="font-inter text-[10px] leading-4 text-secondary-foreground/80">
                      Choose “Not assigned” if you do not have a barangay yet. A
                      contact number is optional but helps the SK reach you
                      about your bids.
                    </Text>

                    <PrimaryButton onPress={handleSave} disabled={saving}>
                      {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        "Save changes"
                      )}
                    </PrimaryButton>

                    <TouchableOpacity
                      className="items-center py-1"
                      onPress={cancelEditing}
                      disabled={saving}
                      activeOpacity={0.7}
                    >
                      <Text className="font-inter-bold text-[10px] uppercase tracking-[0.14em] text-secondary-foreground">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View className="flex-row items-center border-b border-border/70 py-3">
                      <View className="mr-3 h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border/70 bg-secondary">
                        {profile?.avatar_url ? (
                          <Image
                            source={{ uri: profile.avatar_url }}
                            style={{ width: 44, height: 44 }}
                            resizeMode="cover"
                          />
                        ) : (
                          <Camera size={16} color="#94A3B8" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-inter-bold text-[9px] uppercase tracking-[0.12em] text-secondary-foreground">
                          Profile photo
                        </Text>
                        <Text className="font-inter mt-1 text-[11px] text-secondary-foreground/80">
                          JPG, PNG, or WebP up to 5 MB.
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="rounded-lg border border-primary/20 bg-secondary/40 px-3 py-2"
                        activeOpacity={0.75}
                        onPress={handleChangeAvatar}
                        disabled={avatarSaving}
                        accessibilityRole="button"
                        accessibilityLabel="Change profile photo"
                      >
                        {avatarSaving ? (
                          <ActivityIndicator color="#0138A8" size="small" />
                        ) : (
                          <Text className="font-inter-bold text-[9px] uppercase tracking-[0.12em] text-primary">
                            {profile?.avatar_url ? "Change" : "Upload"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    <DetailRow
                      icon={User}
                      label="Registered name"
                      value={profile?.full_name || companyName}
                    />
                    <DetailRow
                      icon={Building2}
                      label="Company name"
                      value={profile?.company_name || "Not set"}
                    />
                    <DetailRow
                      icon={Mail}
                      label="Email"
                      value={profile?.email || email || "Not set"}
                    />
                    <DetailRow
                      icon={Phone}
                      label="Contact number"
                      value={profile?.contact_number || "Not set"}
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

                    <TouchableOpacity
                      className="mt-3 flex-row items-center justify-center gap-2 rounded-lg border border-primary/20 bg-secondary/40 py-2.5"
                      onPress={startEditing}
                      activeOpacity={0.75}
                    >
                      <Pencil size={13} color="#0138A8" />
                      <Text className="font-inter-bold text-[10px] uppercase tracking-[0.14em] text-primary">
                        Edit profile
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
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
      </KeyboardAvoidingView>
    </View>
  );
}
