import ScreenHeader from "@/components/ui/ScreenHeader";
import { ProjectCardSkeleton } from "@/components/ui/Skeletons";
import Skeleton from "@/components/ui/Skeleton";
import {
  daysLeftLabel,
  fetchMyBidsCounts,
  fetchMyProfile,
  fetchOpenProjects,
  formatPeso,
  getErrorMessage,
  type Project,
} from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  Inbox,
  MapPin,
  RefreshCw,
  Trophy,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomePage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("Vendor");
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [totalBids, setTotalBids] = useState(0);
  const [pendingBids, setPendingBids] = useState(0);
  const [wonBids, setWonBids] = useState(0);
  const [opportunities, setOpportunities] = useState<Project[]>([]);

  const loadDashboard = useCallback(async () => {
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const profile = await fetchMyProfile(user.id);
      setCompanyName(
        profile?.full_name ||
          user.user_metadata?.company_name ||
          user.email?.split("@")[0] ||
          "Vendor",
      );

      const [counts, projects] = await Promise.all([
        fetchMyBidsCounts(user.id),
        fetchOpenProjects(),
      ]);

      setTotalBids(counts.total);
      setPendingBids(counts.pending);
      setWonBids(counts.won);
      setOpportunities(projects.slice(0, 3));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your dashboard."));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  const stats = [
    {
      label: "Submitted",
      value: totalBids,
      icon: Briefcase,
      color: "#0138A8",
      accent: "bg-primary",
    },
    {
      label: "In review",
      value: pendingBids,
      icon: CircleDollarSign,
      color: "#D97706",
      accent: "bg-pending",
    },
    {
      label: "Won",
      value: wonBids,
      icon: Trophy,
      color: "#10B981",
      accent: "bg-success",
    },
  ];

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="bg-white" edges={["top"]} />

      <Animated.View entering={FadeIn.duration(350)}>
      <ScreenHeader
        brand
        eyebrow="Vendor Dashboard"
        title={companyName}
        subtitle="Your procurement activity at a glance."
        right={
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Text className="font-inter-black text-[18px] text-white">
              {companyName.charAt(0).toUpperCase()}
            </Text>
            <View className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-success" />
          </View>
        }
      />
      </Animated.View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#0138A8"
          />
        }
      >
        {/* STAT CARDS */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)}>
        <View className="mt-5 flex-row gap-3 px-6">
          {stats.map((stat) => (
            <View
              key={stat.label}
              className="flex-1 overflow-hidden rounded-2xl border border-border bg-white px-3 pb-4 pt-4"
              style={{
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.03,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <View className={`absolute inset-x-0 top-0 h-[3px] ${stat.accent}`} />
              <View className="mb-3 h-7 w-7 items-center justify-center rounded-lg border border-border/70 bg-secondary">
                <stat.icon size={14} color={stat.color} />
              </View>
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-8 rounded-md" />
                  <Skeleton className="mt-2 h-2.5 w-14 rounded-full" />
                </>
              ) : (
                <>
                  <Text className="font-inter-black text-[22px] leading-none tracking-tight text-primary-foreground">
                    {stat.value}
                  </Text>
                  <Text className="font-inter-bold mt-1.5 text-[9px] uppercase tracking-[0.1em] text-secondary-foreground">
                    {stat.label}
                  </Text>
                </>
              )}
            </View>
          ))}
        </View>
        </Animated.View>

        {error ? (
          <View className="mx-6 mt-5 rounded-2xl border border-danger/25 bg-danger/[0.06] p-4">
            <View className="flex-row items-start gap-2.5">
              <RefreshCw size={15} color="#DC2626" style={{ marginTop: 2 }} />
              <Text className="font-inter-semibold flex-1 text-[12px] leading-5 text-danger">
                {error}
              </Text>
            </View>
            <TouchableOpacity
              className="mt-3 self-start rounded-lg border border-danger/20 bg-white px-3.5 py-2"
              onPress={() => {
                setIsLoading(true);
                loadDashboard();
              }}
              activeOpacity={0.8}
            >
              <Text className="font-inter-bold text-[10px] uppercase tracking-[0.1em] text-danger">
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* OPPORTUNITIES */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)}>
        <View className="mb-3 mt-7 flex-row items-end justify-between px-6">
          <View>
            <Text className="font-inter-bold text-[9px] uppercase tracking-[0.18em] text-secondary-foreground">
              Live procurements
            </Text>
            <Text className="font-inter-black mt-1 text-[19px] tracking-tight text-primary-foreground">
              Open opportunities
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.6}
            className="flex-row items-center gap-0.5 pb-0.5"
            onPress={() => router.push("/(tabs)/opportunities")}
          >
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.1em] text-primary">
              View all
            </Text>
            <ChevronRight size={13} color="#0138A8" />
          </TouchableOpacity>
        </View>
        </Animated.View>

        <View className="gap-3 px-6">
          {isLoading && !error ? (
            <>
              {[0, 1, 2].map((item) => (
                <ProjectCardSkeleton key={item} />
              ))}
            </>
          ) : opportunities.length === 0 ? (
            <View className="items-center rounded-3xl border border-border bg-white px-6 py-9">
              <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary">
                <Inbox size={20} color="#64748B" />
              </View>
              <Text className="font-inter-bold text-[13px] text-primary-foreground">
                No open opportunities
              </Text>
              <Text className="font-inter mt-1 text-center text-[11px] leading-4 text-secondary-foreground">
                New procurements from the SK portal will appear here.
              </Text>
            </View>
          ) : (
            opportunities.map((opp, index) => (
              <Animated.View
                key={opp.id}
                entering={FadeInDown.duration(320).delay(
                  Math.min(index, 4) * 45,
                )}
              >
              <TouchableOpacity
                className="overflow-hidden rounded-2xl border border-border bg-white p-4"
                style={{
                  shadowColor: "#0F172A",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 3,
                  elevation: 1,
                }}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/opportunity/[id]",
                    params: { id: opp.id },
                  })
                }
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 flex-row items-center gap-2">
                    <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <Text
                      className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground"
                      numberOfLines={1}
                    >
                      {opp.category || "General"}
                    </Text>
                  </View>
                  <View className="rounded-full border border-border bg-secondary/50 px-2.5 py-1">
                    <Text className="font-inter-bold text-[9px] uppercase tracking-[0.06em] text-secondary-foreground">
                      {daysLeftLabel(opp)}
                    </Text>
                  </View>
                </View>

                <Text className="font-inter-bold mt-2.5 text-[16px] leading-6 text-primary-foreground">
                  {opp.name}
                </Text>

                <View className="mt-3.5 flex-row items-center justify-between border-t border-border/70 pt-3">
                  <View className="flex-1 flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1">
                      <MapPin size={12} color="#94A3B8" />
                      <Text
                        className="font-inter-medium text-[11px] text-secondary-foreground"
                        numberOfLines={1}
                      >
                        {opp.location}
                      </Text>
                    </View>
                    <Text className="font-inter-extrabold text-[13px] text-primary">
                      {formatPeso(opp.budget)}
                    </Text>
                  </View>
                  <View className="h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary">
                    <ChevronRight size={15} color="#0138A8" />
                  </View>
                </View>
              </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
