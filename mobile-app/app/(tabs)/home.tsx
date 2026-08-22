import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  Trophy,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BidRow {
  id: string;
  status: string;
}

interface OpportunityRow {
  id: string;
  title: string;
  department: string | null;
  budget: number | null;
  deadline: string | null;
  category: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const formatPeso = (value: number | null | undefined) =>
  `₱${Number(value ?? 0).toLocaleString("en-US")}`;

export default function HomePage() {
  const [companyName, setCompanyName] = useState("Vendor");
  const [isLoading, setIsLoading] = useState(true);
  const [totalBids, setTotalBids] = useState(0);
  const [pendingBids, setPendingBids] = useState(0);
  const [wonBids, setWonBids] = useState(0);
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.user_metadata?.company_name) {
        setCompanyName(user.user_metadata.company_name);
      }

      if (!user) return;

      const { data: bids } = await supabase
        .from("bids")
        .select("id, status")
        .eq("user_id", user.id);

      if (bids) {
        const rows = bids as BidRow[];
        const normalize = (status: string | null) =>
          (status ?? "").trim().toLowerCase();
        setTotalBids(rows.length);
        setPendingBids(
          rows.filter((b) =>
            ["pending", "recommended"].includes(normalize(b.status)),
          ).length,
        );
        setWonBids(
          rows.filter((b) => normalize(b.status) === "won").length,
        );
      }

      const { data: opps } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

      if (opps) setOpportunities(opps as OpportunityRow[]);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <View className="flex-1 bg-background">
      <StatusBar barStyle="light-content" backgroundColor="#0138A8" />

      {/* Dark Brand Header */}
      <SafeAreaView
        className="rounded-b-[32px] bg-primary pb-10"
        edges={["top"]}
      >
        <View className="flex-row items-center justify-between px-6 pt-2.5">
          <View>
            <Text className="font-inter-medium mb-1 text-base text-secondary-foreground">
              Welcome back,
            </Text>
            <Text className="font-inter-extrabold text-[28px] tracking-tight text-white">
              {companyName}
            </Text>
          </View>
          <View
            className="h-12 w-12 items-center justify-center rounded-full bg-tertiary"
            style={{ shadowColor: "#FBD219", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }}
          >
            <Text className="font-inter-bold text-[22px] text-primary">
              {companyName.charAt(0)}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Floating Dashboard Stats Card */}
        <View
          className="mx-6 mt-5 flex-row items-center justify-between rounded-3xl bg-white px-4 py-5"
          style={{ shadowColor: "#0138A8", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 }}
        >
          <View className="flex-1 items-center">
            <View className="mb-2.5 h-11 w-11 items-center justify-center rounded-[14px] bg-[#F0F9FF]">
              <Briefcase size={22} color="#0284C7" />
            </View>
            <Text className="font-inter-extrabold mb-0.5 text-[22px] text-primary-foreground">
              {isLoading ? "–" : totalBids}
            </Text>
            <Text className="font-inter-semibold text-xs text-secondary-foreground">Active Bids</Text>
          </View>

          <View className="h-10 w-px bg-background" />

          <View className="flex-1 items-center">
            <View className="mb-2.5 h-11 w-11 items-center justify-center rounded-[14px] bg-[#FEF3C7]">
              <CircleDollarSign size={22} color="#D97706" />
            </View>
            <Text className="font-inter-extrabold mb-0.5 text-[22px] text-primary-foreground">
              {isLoading ? "–" : pendingBids}
            </Text>
            <Text className="font-inter-semibold text-xs text-secondary-foreground">Pending</Text>
          </View>

          <View className="h-10 w-px bg-background" />

          <View className="flex-1 items-center">
            <View className="mb-2.5 h-11 w-11 items-center justify-center rounded-[14px] bg-[#DCFCE7]">
              <Trophy size={22} color="#16A34A" />
            </View>
            <Text className="font-inter-extrabold mb-0.5 text-[22px] text-primary-foreground">
              {isLoading ? "–" : wonBids}
            </Text>
            <Text className="font-inter-semibold text-xs text-secondary-foreground">Contracts</Text>
          </View>
        </View>

        {/* Recent Opportunities Section */}
        <View className="mb-4 mt-8 flex-row items-center justify-between px-6">
          <View className="flex-row items-center gap-2">
            <Text className="font-inter-extrabold ml-1.5 text-xl text-primary-foreground">
              New Opportunities
            </Text>
          </View>
          <TouchableOpacity activeOpacity={0.6}>
            <Text className="font-inter-bold text-sm text-primary">See All</Text>
          </TouchableOpacity>
        </View>

        <View className="gap-4 px-6">
          {isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#0138A8" />
            </View>
          ) : opportunities.length === 0 ? (
            <View className="rounded-3xl border border-background bg-white p-8">
              <Text className="font-inter-medium text-center text-sm text-secondary-foreground">
                No open opportunities right now. Check back soon!
              </Text>
            </View>
          ) : (
            opportunities.map((opp) => {
              const daysLeft = opp.deadline
                ? Math.ceil(
                    (new Date(opp.deadline).getTime() - Date.now()) / DAY_MS,
                  )
                : null;

              return (
                <TouchableOpacity
                  key={opp.id}
                  className="rounded-3xl border border-background bg-white p-5"
                  style={{ shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 }}
                  activeOpacity={0.8}
                >
                  <View className="mb-3 flex-row items-center justify-between">
                    <View className="rounded-lg border border-border bg-background px-2.5 py-1.5">
                      <Text className="font-inter-bold text-[11px] uppercase tracking-[0.5px] text-slate-600">
                        {opp.department || opp.category || "Procurement"}
                      </Text>
                    </View>
                    <Text className="font-inter-semibold text-xs text-danger">
                      {daysLeft === null
                        ? "Open"
                        : daysLeft > 0
                          ? `Closes in ${daysLeft}d`
                          : "Closed"}
                    </Text>
                  </View>

                  <Text className="font-inter-bold mb-4 text-lg leading-6 text-primary-foreground">
                    {opp.title}
                  </Text>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row gap-2">
                      {opp.category && (
                        <View className="rounded-[10px] bg-background px-3 py-1.5">
                          <Text className="font-inter-semibold text-[13px] text-slate-600">
                            {opp.category}
                          </Text>
                        </View>
                      )}
                      <View className="rounded-[10px] bg-[#FEF3C7] px-3 py-1.5">
                        <Text className="font-inter-bold text-[13px] text-[#D97706]">
                          {formatPeso(opp.budget)}
                        </Text>
                      </View>
                    </View>
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                      <ChevronRight size={18} color="#0138A8" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
