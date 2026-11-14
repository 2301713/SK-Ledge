import PrimaryButton from "@/components/ui/PrimaryButton";
import { SubmitBidSkeleton } from "@/components/ui/Skeletons";
import Skeleton from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase";
import {
  fetchProjectById,
  formatDate,
  formatPeso,
  getErrorMessage,
  hasActiveBid,
  type Project,
} from "@/lib/projects";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  CircleAlert,
  FileText,
  Info,
  UploadCloud,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
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

const MAX_FILE_BYTES = 25 * 1024 * 1024;

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);

export default function SubmitBidPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [project, setProject] = useState<Project | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "blocked">(
    "loading",
  );
  const [blockedReason, setBlockedReason] = useState("");

  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        if (!id) throw new Error("Missing procurement reference.");

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in again to submit a bid.");
        setUserId(user.id);

        const [loadedProject, activeBid] = await Promise.all([
          fetchProjectById(id),
          hasActiveBid(user.id, id),
        ]);

        setProject(loadedProject);

        if (!loadedProject.acceptingBids) {
          setBlockedReason(
            "This procurement is no longer accepting proposals.",
          );
          setLoadState("blocked");
          return;
        }
        if (activeBid) {
          setBlockedReason(
            "You already have an active bid for this procurement. Withdraw it from My Bids before submitting another.",
          );
          setLoadState("blocked");
          return;
        }

        setLoadState("ready");
      } catch (err) {
        setBlockedReason(
          getErrorMessage(err, "Could not prepare this bid submission."),
        );
        setLoadState("blocked");
      }
    };

    prepare();
  }, [id]);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length) {
        const file = result.assets[0];
        if (file.size && file.size > MAX_FILE_BYTES) {
          setFieldErrors((prev) => ({
            ...prev,
            file: "Proposal must be 25MB or smaller.",
          }));
          return;
        }
        setFieldErrors((prev) => ({ ...prev, file: "" }));
        setSelectedFile(file);
      }
    } catch {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Failed to select that document. Try another PDF.",
      }));
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    const bidAmount = Number(amount.replace(/,/g, ""));

    if (!amount.trim()) {
      errors.amount = "Enter your total bid amount.";
    } else if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      errors.amount = "Bid amount must be a valid amount greater than zero.";
    } else if (project && bidAmount > project.budget) {
      errors.amount = `Bid cannot exceed the approved budget of ${formatPeso(
        project.budget,
      )}.`;
    }

    if (!timeline.trim()) {
      errors.timeline = "Enter your estimated delivery timeline.";
    }
    if (!selectedFile) {
      errors.file = "Upload your technical proposal as a PDF.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !project || !userId || !selectedFile) return;

    setIsSubmitting(true);
    setSubmitError("");

    let uploadedPath: string | null = null;

    try {
      const response = await fetch(selectedFile.uri);
      const arrayBuffer = await response.arrayBuffer();
      const storagePath = `${userId}/${project.id}/${Date.now()}_${sanitizeFileName(
        selectedFile.name || "proposal.pdf",
      )}`;

      const { error: uploadError } = await supabase.storage
        .from("proposals")
        .upload(storagePath, arrayBuffer, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;
      uploadedPath = storagePath;

      const { data: publicUrlData } = supabase.storage
        .from("proposals")
        .getPublicUrl(storagePath);

      const { error: insertError } = await supabase.from("bids").insert([
        {
          project_id: project.id,
          user_id: userId,
          vendor_id: userId,
          contract_title: project.name,
          department: project.location,
          amount_php: Number(amount.replace(/,/g, "")),
          timeline: timeline.trim(),
          notes: notes.trim() || null,
          proposal_url: publicUrlData.publicUrl,
          status: "pending",
          submitted_on: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (err) {
      if (uploadedPath) {
        await supabase.storage.from("proposals").remove([uploadedPath]);
      }
      setSubmitError(
        getErrorMessage(err, "Your bid could not be submitted. Try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmWithdrawNavigation = () => {
    Alert.alert(
      "Bid already exists",
      "You already have an active bid for this procurement. You can withdraw it from My Bids.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Go to My Bids",
          onPress: () => router.replace("/(tabs)/my-bids"),
        },
      ],
    );
  };

  if (loadState === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-inter-bold text-lg text-primary-foreground">
            Submit Proposal
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <SubmitBidSkeleton />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-6 pb-8 pt-4">
          <Skeleton className="h-14 w-full rounded-xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadState === "blocked" || !project) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row items-center border-b border-border bg-background px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-inter-bold ml-1 text-lg text-primary-foreground">
            Submit Proposal
          </Text>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <CircleAlert size={34} color="#DC2626" />
          <Text className="font-inter-semibold mt-3 text-center text-base leading-6 text-secondary-foreground">
            {blockedReason || "This procurement is unavailable."}
          </Text>
          <TouchableOpacity
            className="mt-5 rounded-xl bg-primary px-5 py-2.5"
            onPress={() => router.back()}
          >
            <Text className="font-inter-semibold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background px-8">
        <View className="mb-5 h-16 w-16 items-center justify-center rounded-full bg-success/10">
          <CheckCircle size={34} color="#16A34A" />
        </View>
        <Text className="font-inter-extrabold mb-2 text-center text-2xl text-primary-foreground">
          Bid submitted
        </Text>
        <Text className="font-inter mb-6 text-center text-[15px] leading-6 text-secondary-foreground">
          Your proposal for {project.name} is now pending review. Track its
          status from My Bids.
        </Text>
        <TouchableOpacity
          className="w-full items-center rounded-2xl bg-primary py-4"
          onPress={() => router.replace("/(tabs)/my-bids")}
        >
          <Text className="font-inter-bold text-base text-white">
            View My Bids
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Custom Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-inter-bold text-lg text-primary-foreground">
          Submit Proposal
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <FileText size={14} color="#0138A8" />
              <Text className="font-inter-bold text-[11px] uppercase tracking-[0.5px] text-primary">
                Bidding for
              </Text>
            </View>
            <Text className="font-inter-bold text-base leading-5 text-primary-foreground">
              {project.name}
            </Text>
            <Text className="font-inter mt-1 text-[13px] text-secondary-foreground">
              ABC {formatPeso(project.budget)} · Closes {formatDate(project.deadline)}
            </Text>
          </View>

          {submitError ? (
            <View className="mb-5 flex-row items-start gap-3 rounded-2xl border border-danger/30 bg-danger/[0.06] p-4">
              <CircleAlert size={18} color="#DC2626" />
              <Text className="font-inter-medium flex-1 text-[13px] leading-5 text-danger">
                {submitError}
              </Text>
            </View>
          ) : null}

          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Total Bid Amount (PHP) *
            </Text>
            <View
              className={`flex-row items-center rounded-2xl border bg-white px-4 ${
                fieldErrors.amount ? "border-danger" : "border-border"
              }`}
            >
              <Text className="font-inter-bold mr-2 text-base text-secondary-foreground">
                ₱
              </Text>
              <TextInput
                className="font-inter flex-1 py-3.5 text-base text-primary-foreground"
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={amount}
                onChangeText={(value) => {
                  setAmount(value);
                  setFieldErrors((prev) => ({ ...prev, amount: "" }));
                }}
                editable={!isSubmitting}
              />
            </View>
            {fieldErrors.amount ? (
              <Text className="font-inter-medium mt-1.5 text-xs text-danger">
                {fieldErrors.amount}
              </Text>
            ) : (
              <View className="mt-1.5 flex-row items-center gap-1.5">
                <Info size={12} color="#64748B" />
                <Text className="font-inter text-xs text-secondary-foreground">
                  Must not exceed the approved budget.
                </Text>
              </View>
            )}
          </View>

          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Estimated Timeline *
            </Text>
            <TextInput
              className={`rounded-2xl border bg-white px-4 py-3.5 text-base text-primary-foreground ${
                fieldErrors.timeline ? "border-danger" : "border-border"
              }`}
              placeholder="e.g., 6 Months, 45 Days"
              placeholderTextColor="#64748B"
              value={timeline}
              onChangeText={(value) => {
                setTimeline(value);
                setFieldErrors((prev) => ({ ...prev, timeline: "" }));
              }}
              editable={!isSubmitting}
            />
            {fieldErrors.timeline ? (
              <Text className="font-inter-medium mt-1.5 text-xs text-danger">
                {fieldErrors.timeline}
              </Text>
            ) : null}
          </View>

          {/* Document Upload */}
          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Technical Proposal (PDF) *
            </Text>

            <TouchableOpacity
              className={`items-center justify-center rounded-2xl border-2 border-dashed bg-white p-8 ${
                selectedFile
                  ? "border-success bg-success/10"
                  : fieldErrors.file
                    ? "border-danger"
                    : "border-border"
              }`}
              onPress={handleDocumentPick}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              {selectedFile ? (
                <>
                  <CheckCircle size={32} color="#16A34A" />
                  <Text
                    className="font-inter-bold mb-1 mt-3 text-center text-base text-success"
                    numberOfLines={1}
                  >
                    {selectedFile.name}
                  </Text>
                  <Text className="font-inter text-xs text-secondary-foreground">
                    Tap to replace file
                  </Text>
                </>
              ) : (
                <>
                  <UploadCloud size={32} color="#0138A8" />
                  <Text className="font-inter-bold mb-1 mt-3 text-base text-primary">
                    Upload Document
                  </Text>
                  <Text className="font-inter text-xs text-secondary-foreground">
                    PDF only · Max size: 25MB
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {fieldErrors.file ? (
              <Text className="font-inter-medium mt-1.5 text-xs text-danger">
                {fieldErrors.file}
              </Text>
            ) : null}
          </View>

          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Additional Notes (Optional)
            </Text>
            <TextInput
              className="rounded-2xl border border-border bg-white px-4 py-3.5 text-base text-primary-foreground"
              style={{ height: 100, textAlignVertical: "top" }}
              placeholder="Clarifications or special terms..."
              placeholderTextColor="#64748B"
              multiline
              value={notes}
              onChangeText={setNotes}
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            onPress={confirmWithdrawNavigation}
            activeOpacity={0.7}
            className="items-center py-1"
          >
            <Text className="font-inter text-xs text-secondary-foreground">
              Already submitted for this project?
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-6 pb-8 pt-4">
        <PrimaryButton onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            "Submit Bid"
          )}
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}
