import {
  daysLeftLabel,
  fetchProjectById,
  formatDate,
  formatPeso,
  getErrorMessage,
  type Project,
} from "@/lib/projects";
import { OpportunityDetailsSkeleton } from "@/components/ui/Skeletons";
import Skeleton from "@/components/ui/Skeleton";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CircleAlert,
  FileText,
  MapPin,
  PhilippinePeso as Peso,
  Trophy,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <View className="flex-row items-center rounded-2xl border border-border bg-white px-4 py-3.5">
    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-background">
      <Icon size={18} color="#0138A8" />
    </View>
    <View className="flex-1">
      <Text className="font-inter-semibold text-[11px] uppercase tracking-[0.5px] text-secondary-foreground">
        {label}
      </Text>
      <Text className="font-inter-bold mt-0.5 text-[15px] text-primary-foreground">
        {value}
      </Text>
    </View>
  </View>
);

export default function OpportunityDetailsPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [opportunity, setOpportunity] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setOpportunity(await fetchProjectById(id));
    } catch (err) {
      setOpportunity(null);
      setError(getErrorMessage(err, "Could not load this procurement."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let active = true;

    fetchProjectById(id)
      .then((project) => {
        if (active) setOpportunity(project);
      })
      .catch((err) => {
        if (!active) return;
        setOpportunity(null);
        setError(getErrorMessage(err, "Could not load this procurement."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (!id) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <CircleAlert size={32} color="#DC2626" />
          <Text className="font-inter-semibold mb-4 mt-3 text-center text-base text-secondary-foreground">
            Missing procurement reference.
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-inter-bold text-lg text-primary-foreground">
            Contract Details
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <OpportunityDetailsSkeleton />
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-6 pb-8 pt-4">
          <Skeleton className="h-14 w-full rounded-2xl" />
        </View>
      </SafeAreaView>
    );
  }

  if (!opportunity) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center p-6">
          <CircleAlert size={32} color="#DC2626" />
          <Text className="font-inter-semibold mb-4 mt-3 text-center text-base text-secondary-foreground">
            {error || "Contract details not found."}
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

  const isAwarded = opportunity.status.toLowerCase() === "awarded";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-inter-bold text-lg text-primary-foreground">
          Contract Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setError("");
              setRefreshing(true);
              load();
            }}
          />
        }
      >
        <View className="mb-6">
          <View className="mb-4 flex-row flex-wrap gap-2">
            <View className="rounded-lg bg-[#E0E7FF] px-2.5 py-1">
              <Text className="font-inter-semibold text-xs text-[#4338CA]">
                {opportunity.category}
              </Text>
            </View>
            <View
              className={`rounded-lg px-2.5 py-1 ${
                opportunity.acceptingBids ? "bg-[#DCFCE7]" : "bg-[#FEE2E2]"
              }`}
            >
              <Text
                className={`font-inter-semibold text-xs ${
                  opportunity.acceptingBids
                    ? "text-[#16A34A]"
                    : "text-[#DC2626]"
                }`}
              >
                {daysLeftLabel(opportunity)}
              </Text>
            </View>
          </View>

          <Text className="font-inter-extrabold mb-3 text-2xl tracking-tight text-primary-foreground">
            {opportunity.name}
          </Text>

          <View className="flex-row items-center gap-2">
            <Building2 size={16} color="#64748B" />
            <Text className="font-inter-medium text-[15px] text-secondary-foreground">
              {opportunity.location}
            </Text>
          </View>
        </View>

        {!opportunity.acceptingBids ? (
          <View className="mb-6 flex-row items-start gap-3 rounded-2xl border border-pending/30 bg-pending/[0.08] p-4">
            <CircleAlert size={18} color="#D97706" />
            <Text className="font-inter-medium flex-1 text-[13px] leading-5 text-[#92400E]">
              {isAwarded
                ? "This procurement has already been awarded and is no longer accepting proposals."
                : "This procurement is closed for new proposals. You can still review its details."}
            </Text>
          </View>
        ) : null}

        <View className="mb-8 gap-3">
          <InfoRow
            icon={Peso}
            label="Approved Budget for the Contract"
            value={formatPeso(opportunity.budget)}
          />
          <InfoRow
            icon={Calendar}
            label="Bid Deadline"
            value={formatDate(opportunity.deadline)}
          />
          <InfoRow
            icon={MapPin}
            label="Delivery Location"
            value={opportunity.location}
          />
          {opportunity.createdAt ? (
            <InfoRow
              icon={FileText}
              label="Published"
              value={formatDate(opportunity.createdAt)}
            />
          ) : null}
        </View>

        <View className="mb-8">
          <Text className="font-inter-bold mb-3 text-lg text-primary-foreground">
            Scope of Work
          </Text>
          <Text className="font-inter text-[15px] leading-6 text-slate-600">
            {opportunity.description ||
              "No project description was provided for this procurement."}
          </Text>
        </View>

        {isAwarded ? (
          <View className="mb-4 flex-row items-center gap-3 rounded-2xl border border-success/30 bg-success/[0.08] p-4">
            <Trophy size={20} color="#16A34A" />
            <Text className="font-inter-semibold flex-1 text-[13px] text-[#166534]">
              {opportunity.winningBidder
                ? `Awarded to ${opportunity.winningBidder} after evaluation.`
                : "This procurement has been awarded after evaluation."}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-6 pb-8 pt-4">
        <TouchableOpacity
          className={`h-14 items-center justify-center rounded-2xl ${
            opportunity.acceptingBids ? "bg-tertiary" : "bg-border"
          }`}
          style={
            opportunity.acceptingBids
              ? { shadowColor: "#FBD219", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 }
              : undefined
          }
          activeOpacity={0.8}
          disabled={!opportunity.acceptingBids}
          onPress={() =>
            router.push({
              pathname: "/submit-bid/[id]",
              params: { id: opportunity.id },
            })
          }
        >
          <Text
            className={`font-inter-extrabold text-lg ${
              opportunity.acceptingBids
                ? "text-primary-foreground"
                : "text-secondary-foreground"
            }`}
          >
            {opportunity.acceptingBids
              ? "Prepare Bid Proposal"
              : "Bidding Closed"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
