import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building,
  Calendar,
  Download,
  FileText,
  PhilippinePeso as Peso,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function OpportunityDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOpportunityDetails();
    }
  }, [id]);

  const fetchOpportunityDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching opportunity details:", error.message);
      } else {
        setOpportunity(data);
      }
    } catch (err) {
      console.error("Exception fetching opportunity:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color="#003366" />
          <Text className="text-[15px] text-secondary-foreground">
            Loading contract details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!opportunity) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="mb-4 text-base text-secondary-foreground">
            Contract details not found.
          </Text>
          <TouchableOpacity
            className="rounded-xl bg-primary px-5 py-2.5"
            onPress={() => router.back()}
          >
            <Text className="font-inter-semibold text-white">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const requirements = opportunity.requirements || [
    "Minimum experience in relevant domain required.",
    "Valid compliance and business permits.",
  ];

  const documents = opportunity.documents || [
    { id: "d1", name: "Terms_and_Conditions.pdf", size: "1.2 MB" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-inter-bold text-lg text-primary-foreground">Contract Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <View className="mb-4 flex-row gap-2">
            {opportunity.category && (
              <View className="rounded-lg bg-[#E0E7FF] px-2.5 py-1">
                <Text className="font-inter-semibold text-xs text-[#4338CA]">{opportunity.category}</Text>
              </View>
            )}
            <View className="rounded-lg bg-[#DCFCE7] px-2.5 py-1">
              <Text className="font-inter-semibold text-xs text-[#16A34A]">{opportunity.status || "Open"}</Text>
            </View>
          </View>

          <Text className="font-inter-extrabold mb-3 text-2xl tracking-tight text-primary-foreground">
            {opportunity.title}
          </Text>

          <View className="flex-row items-center gap-2">
            <Building size={16} color="#64748B" />
            <Text className="font-inter-medium text-[15px] text-secondary-foreground">
              {opportunity.department}
            </Text>
          </View>
        </View>

        <View className="mb-8 gap-4">
          <StatCard label="Estimated Budget" value={opportunity.budget} icon={Peso} />
          <StatCard label="Closing Date" value={opportunity.deadline} icon={Calendar} />
        </View>

        <View className="mb-8">
          <Text className="font-inter-bold mb-3 text-lg text-primary-foreground">Scope of Work</Text>
          <Text className="font-inter text-[15px] leading-6 text-slate-600">
            {opportunity.description || "No detailed description provided."}
          </Text>
        </View>

        <View className="mb-8">
          <Text className="font-inter-bold mb-3 text-lg text-primary-foreground">Minimum Requirements</Text>
          {requirements.map((req: string, index: number) => (
            <View key={index} className="mb-3 flex-row items-start pr-4">
              <View className="mr-3 mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
              <Text className="font-inter flex-1 text-[15px] leading-[22px] text-slate-600">{req}</Text>
            </View>
          ))}
        </View>

        <View className="mb-8">
          <Text className="font-inter-bold mb-3 text-lg text-primary-foreground">Attached Documents</Text>
          {documents.map((doc: any, idx: number) => (
            <Card key={doc.id || idx} className="mb-3 p-4">
              <TouchableOpacity
                className="flex-row items-center"
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-[10px] bg-background">
                  <FileText size={20} color="#0138A8" />
                </View>
                <View className="flex-1">
                  <Text className="font-inter-semibold mb-1 text-sm text-primary-foreground">{doc.name}</Text>
                  <Text className="font-inter text-xs text-secondary-foreground">{doc.size}</Text>
                </View>
                <Download size={20} color="#64748B" />
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-6 pt-4 pb-8">
        <TouchableOpacity
          className="h-14 items-center justify-center rounded-2xl bg-tertiary"
          style={{ shadowColor: "#FBD219", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/submit-bid/[id]",
              params: { id: opportunity.id },
            })
          }
        >
          <Text className="font-inter-extrabold text-lg text-primary-foreground">
            Prepare Bid Proposal
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
