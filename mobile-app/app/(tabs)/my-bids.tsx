import ScreenHeader from "@/components/ui/ScreenHeader";
import { BidCardSkeleton } from "@/components/ui/Skeletons";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  BID_TABS,
  bidStatusGroup,
  bidStatusLabel,
  canWithdrawBid,
  fetchMyBids,
  formatDate,
  formatPeso,
  getErrorMessage,
  withdrawBid,
  type BidItem,
  type BidTab,
} from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import { ClipboardList, RefreshCw, Undo2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyBidsPage() {
  const [activeTab, setActiveTab] = useState<BidTab>("All");
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setSignedOut(true);
        setBids([]);
        return;
      }
      setSignedOut(false);
      setBids(await fetchMyBids(authData.user.id));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your bids."));
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
          setSignedOut(true);
          setBids([]);
          return;
        }
        setSignedOut(false);
        return fetchMyBids(data.user.id).then((rows) => {
          if (active) setBids(rows);
        });
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, "Could not load your bids."));
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Live updates when the SK team scores, awards, or returns a bid.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`vendor-bids-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bids",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchBids();
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchBids]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBids();
  }, [fetchBids]);

  const confirmWithdraw = (bid: BidItem) => {
    Alert.alert(
      "Withdraw this bid?",
      `Your proposal for ${bid.contract_title || "this procurement"} will be withdrawn and the SK office will no longer evaluate it.`,
      [
        { text: "Keep bid", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) throw new Error("Please sign in again.");

              setWithdrawingId(bid.id);
              await withdrawBid(bid.id, user.id);
              setBids((current) =>
                current.map((item) =>
                  item.id === bid.id ? { ...item, status: "withdrawn" } : item,
                ),
              );
            } catch (err) {
              Alert.alert(
                "Withdrawal failed",
                getErrorMessage(err, "Please try again."),
              );
            } finally {
              setWithdrawingId(null);
            }
          },
        },
      ],
    );
  };

  const filteredBids = bids.filter(
    (bid) => activeTab === "All" || bidStatusGroup(bid.status) === activeTab,
  );

  const renderItem = ({ item, index }: { item: BidItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 5) * 40)}
    >
    <View
      className="overflow-hidden rounded-2xl border border-border bg-white"
      style={{
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start justify-between gap-3 px-4 pt-4">
        <View className="flex-1">
          <Text
            className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground"
            numberOfLines={1}
          >
            {item.department || "SK Procurement"}
          </Text>
          <Text className="font-inter-bold mt-1.5 text-[15px] leading-[21px] text-primary-foreground">
            {item.contract_title || "Procurement proposal"}
          </Text>
        </View>
        <StatusBadge status={bidStatusLabel(item.status)} />
      </View>

      <View className="mt-3.5 flex-row items-end justify-between border-t border-border/70 px-4 py-3">
        <View>
          <Text className="font-inter-bold text-[9px] uppercase tracking-[0.12em] text-secondary-foreground">
            Submitted
          </Text>
          <Text className="font-inter-semibold mt-1 text-[12px] text-primary-foreground">
            {formatDate(item.submitted_on || item.created_at)}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-inter-bold text-[9px] uppercase tracking-[0.12em] text-secondary-foreground">
            Bid amount
          </Text>
          <Text className="font-inter-black mt-0.5 text-[17px] tracking-tight text-primary">
            {formatPeso(item.amount_php)}
          </Text>
        </View>
      </View>

      {canWithdrawBid(item.status) ? (
        <View className="border-t border-border/70 px-4 py-2.5">
          <TouchableOpacity
            className="flex-row items-center justify-center gap-1.5 rounded-lg py-2"
            onPress={() => confirmWithdraw(item)}
            disabled={withdrawingId === item.id}
            activeOpacity={0.7}
          >
            {withdrawingId === item.id ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <>
                <Undo2 size={13} color="#DC2626" />
                <Text className="font-inter-bold text-[10px] uppercase tracking-[0.1em] text-danger">
                  Withdraw bid
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="bg-white" edges={["top"]} />

      <Animated.View entering={FadeIn.duration(350)}>
      <ScreenHeader
        eyebrow="Bid Tracker"
        title="My bids"
        subtitle={
          loading
            ? "Loading your proposal history..."
            : `${bids.length} proposal${bids.length === 1 ? "" : "s"} on record`
        }
      />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
      <View className="px-6 pt-4">
        <View className="flex-row rounded-xl border border-border bg-white p-1">
          {BID_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 items-center justify-center rounded-lg py-2.5 ${
                activeTab === tab ? "bg-primary" : "bg-transparent"
              }`}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text
                className={`font-inter-bold text-[10px] uppercase tracking-[0.08em] ${
                  activeTab === tab ? "text-white" : "text-secondary-foreground"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      </Animated.View>

      <View className="mt-4 flex-1">
        {error ? (
          <View className="mx-6 rounded-2xl border border-danger/25 bg-danger/[0.06] p-4">
            <View className="flex-row items-start gap-2.5">
              <RefreshCw size={15} color="#DC2626" style={{ marginTop: 2 }} />
              <Text className="font-inter-semibold flex-1 text-[12px] leading-5 text-danger">
                {error}
              </Text>
            </View>
            <TouchableOpacity
              className="mt-3 self-start rounded-lg border border-danger/20 bg-white px-3.5 py-2"
              onPress={() => {
                setError("");
                setLoading(true);
                fetchBids();
              }}
              activeOpacity={0.8}
            >
              <Text className="font-inter-bold text-[10px] uppercase tracking-[0.1em] text-danger">
                Try again
              </Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View className="gap-3 px-6">
            {[0, 1, 2].map((item) => (
              <BidCardSkeleton key={item} />
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredBids}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#0138A8"
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center px-6 py-[60px]">
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white">
                  <ClipboardList size={21} color="#64748B" />
                </View>
                <Text className="font-inter-bold text-[13px] text-primary-foreground">
                  {signedOut
                    ? "Sign in required"
                    : bids.length === 0
                      ? "No bids yet"
                      : "Nothing in this tab"}
                </Text>
                <Text className="font-inter mt-1 text-center text-[11px] leading-4 text-secondary-foreground">
                  {signedOut
                    ? "Please log in to view your bids."
                    : bids.length === 0
                      ? "Browse open opportunities and submit your first proposal."
                      : "Bids matching this status will appear here."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}
