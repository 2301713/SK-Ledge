import PrimaryButton from "@/components/ui/PrimaryButton";
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

export default function SubmitBidPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  // Form State
  const [amount, setAmount] = useState("");
  const [timeline, setTimeline] = useState("");
  const [notes, setNotes] = useState("");
  const [fileUploaded, setFileUploaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMockUpload = () => {
    // In a real app, you'd use expo-document-picker here
    setFileUploaded(true);
  };

  const handleSubmit = () => {
    if (!amount || !timeline || !fileUploaded) {
      Alert.alert(
        "Missing Information",
        "Please fill out all required fields and upload your proposal document.",
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate an API call to Supabase to insert the bid
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Bid Submitted!",
        "Your proposal has been securely transmitted to the agency.",
        [
          {
            text: "View Dashboard",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ],
      );
    }, 1500);
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
                fileUploaded ? "border-success bg-success/10" : "border-border"
              }`}
              onPress={handleMockUpload}
              activeOpacity={0.7}
            >
              {fileUploaded ? (
                <>
                  <CheckCircle size={32} color="#16A34A" />
                  <Text className="font-inter-bold mb-1 mt-3 text-base text-success">
                    Document_Ready.pdf
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