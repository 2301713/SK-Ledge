import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CheckCircle,
  FileUp,
  UploadCloud,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Proposal</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              You are submitting a bid for contract ID:{" "}
              <Text style={{ fontWeight: "bold" }}>{id}</Text>
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Total Bid Amount (PHP) *</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>₱</Text>
              <TextInput
                style={styles.inputWithPrefix}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Estimated Timeline *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 6 Months, 45 Days"
              placeholderTextColor="#94A3B8"
              value={timeline}
              onChangeText={setTimeline}
            />
          </View>

          {/* Document Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Technical Proposal (PDF) *</Text>

            <TouchableOpacity
              style={[
                styles.uploadBox,
                fileUploaded && styles.uploadBoxSuccess,
              ]}
              onPress={handleMockUpload}
              activeOpacity={0.7}
            >
              {fileUploaded ? (
                <>
                  <CheckCircle size={32} color="#16A34A" />
                  <Text style={styles.uploadTextSuccess}>
                    Document_Ready.pdf
                  </Text>
                  <Text style={styles.uploadSubtext}>Tap to replace file</Text>
                </>
              ) : (
                <>
                  <UploadCloud size={32} color="#003366" />
                  <Text style={styles.uploadText}>Upload Document</Text>
                  <Text style={styles.uploadSubtext}>Max size: 25MB</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Clarifications or special terms..."
              placeholderTextColor="#94A3B8"
              multiline
              textAlignVertical="top"
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            isSubmitting && styles.primaryButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#003366" />
          ) : (
            <>
              <FileUp size={20} color="#003366" />
              <Text style={styles.primaryButtonText}>Sign & Submit Bid</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E293B",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  infoBanner: {
    backgroundColor: "#E0E7FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoText: {
    color: "#4338CA",
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#64748B",
    marginRight: 8,
  },
  inputWithPrefix: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1E293B",
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadBoxSuccess: {
    borderColor: "#16A34A",
    backgroundColor: "#DCFCE7",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#003366",
    marginTop: 12,
    marginBottom: 4,
  },
  uploadTextSuccess: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#16A34A",
    marginTop: 12,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: "#64748B",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#FFCC00",
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#FFCC00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#003366",
    fontSize: 18,
    fontWeight: "bold",
  },
});
