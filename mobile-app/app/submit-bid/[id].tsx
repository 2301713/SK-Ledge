import PrimaryButton from "@/components/ui/PrimaryButton";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, UploadCloud } from "lucide-react-native";
import React, { useState } from "react";
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
import { supabase } from "../../lib/supabase";

export default function SubmitBidPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select document.");
    }
  };

  const handleSubmit = async () => {
    if (!amount || !timeline || !selectedFile) {
      Alert.alert(
        "Missing Information",
        "Please fill out all required fields and upload your proposal document."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const fileName = `${Date.now()}_${selectedFile.name}`;

      const { error: uploadError } = await supabase.storage
        .from("proposals")
        .upload(fileName, blob, {
          contentType: "application/pdf",
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("proposals")
        .getPublicUrl(fileName);

      const proposalUrl = publicUrlData.publicUrl;

      const { data: oppData } = await supabase
        .from("opportunities")
        .select("title, department")
        .eq("id", id)
        .single();

      if (!oppData) {
        throw new Error("Opportunity not found. It may have been removed.");
      }

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      const { error: insertError } = await supabase.from("bids").insert([
        {
          opportunity_id: id,
          user_id: userId,
          contract_title: oppData.title,
          department: oppData.department,
          amount: `₱${amount}`,
          proposal_url: proposalUrl,
          status: "Pending",
          submitted_on: new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        },
      ]);

      if (insertError) throw insertError;

      Alert.alert(
        "Bid Submitted!",
        "Your proposal has been securely transmitted to the agency.",
        [
          {
            text: "View My Bids",
            onPress: () => router.replace("/(tabs)/my-bids"),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Submission Failed", error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      {/* Custom Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-inter-bold text-lg text-primary-foreground">Submit Proposal</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-6 rounded-xl bg-[#E0E7FF] p-4">
            <Text className="text-sm text-[#4338CA]">
              You are submitting a bid for contract ID:{" "}
              <Text className="font-inter-bold">{id}</Text>
            </Text>
          </View>

          {/* Form Fields */}
          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Total Bid Amount (PHP) *
            </Text>
            <View className="flex-row items-center rounded-2xl border border-border bg-white px-4">
              <Text className="font-inter-bold mr-2 text-base text-secondary-foreground">₱</Text>
              <TextInput
                className="font-inter flex-1 py-3.5 text-base text-primary-foreground"
                placeholder="0.00"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Estimated Timeline *
            </Text>
            <TextInput
              className="rounded-2xl border border-border bg-white px-4 py-3.5 text-base text-primary-foreground"
              placeholder="e.g., 6 Months, 45 Days"
              placeholderTextColor="#64748B"
              value={timeline}
              onChangeText={setTimeline}
            />
          </View>

          {/* Document Upload */}
          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Technical Proposal (PDF) *
            </Text>

            <TouchableOpacity
              className={`items-center justify-center rounded-2xl border-2 border-dashed bg-white p-8 ${
                selectedFile ? "border-success bg-success/10" : "border-border"
              }`}
              onPress={handleDocumentPick}
              activeOpacity={0.7}
            >
              {selectedFile ? (
                <>
                  <CheckCircle size={32} color="#16A34A" />
                  <Text className="font-inter-bold mb-1 mt-3 text-center text-base text-success" numberOfLines={1}>
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
                    Max size: 25MB
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View className="mb-5">
            <Text className="font-inter-semibold mb-2 text-sm text-primary-foreground">
              Additional Notes (Optional)
            </Text>
            <TextInput
              className="rounded-2xl border border-border bg-white px-4 py-3.5 text-base text-primary-foreground"
              style={{ height: 100, paddingTop: 14, textAlignVertical: "top" }}
              placeholder="Clarifications or special terms..."
              placeholderTextColor="#64748B"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-6 pt-4 pb-8">
        <PrimaryButton onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#1E293B" />
          ) : (
            "Sign & Submit Bid"
          )}
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}
