import {
  bidStatusLabel,
  fetchBidNotifications,
  fetchNotificationLastSeen,
  getErrorMessage,
  markNotificationsSeen,
  NOTIFICATIONS_PAGE_SIZE,
  type BidNotification,
} from "@/lib/projects";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Trophy,
  Undo2,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const statusVisual = (status: string | null | undefined) => {
  const normalized = (status ?? "").trim().toLowerCase();

  if (["won", "awarded"].includes(normalized)) {
    return { icon: Trophy, color: "#16A34A", bg: "bg-success/10" };
  }
  if (normalized === "recommended") {
    return { icon: CheckCircle2, color: "#0138A8", bg: "bg-primary/10" };
  }
  if (["lost", "rejected", "declined"].includes(normalized)) {
    return { icon: XCircle, color: "#DC2626", bg: "bg-danger/10" };
  }
  if (normalized === "withdrawn") {
    return { icon: Undo2, color: "#64748B", bg: "bg-secondary" };
  }
  return { icon: Bell, color: "#0138A8", bg: "bg-secondary" };
};

const statusMessage = (status: string | null | undefined) => {
  const normalized = (status ?? "").trim().toLowerCase();

  if (normalized === "recommended") {
    return "Your bid was recommended for award.";
  }
  if (["won", "awarded"].includes(normalized)) {
    return "Your bid was awarded.";
  }
  if (["lost", "rejected", "declined"].includes(normalized)) {
    return "Your bid was not selected.";
  }
  if (normalized === "withdrawn") {
    return "You withdrew this bid.";
  }
  if (normalized === "pending") {
    return "Your bid is pending review.";
  }
  return `Status changed to ${bidStatusLabel(status)}.`;
};

export default function NotificationsPage() {
  const router = useRouter();

  const [items, setItems] = useState<BidNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    try {
      const page = await fetchBidNotifications({
        limit: NOTIFICATIONS_PAGE_SIZE,
        offset,
      });

      setItems((current) => {
        if (append && current.length !== offset) return current;
        return append ? [...current, ...page] : page;
      });
      setHasMore(page.length === NOTIFICATIONS_PAGE_SIZE);
      void markNotificationsSeen().catch(() => {});
    } catch (err) {
      if (!append) {
        setError(getErrorMessage(err, "Could not load notifications."));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    Promise.all([
      fetchBidNotifications({ limit: NOTIFICATIONS_PAGE_SIZE }),
      fetchNotificationLastSeen().catch(() => null),
    ])
      .then(([page, seen]) => {
        if (!active) return;
        setItems(page);
        setHasMore(page.length === NOTIFICATIONS_PAGE_SIZE);
        setLastSeenAt(seen);
        void markNotificationsSeen().catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err, "Could not load notifications."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setHasMore(true);
    loadPage(0, false);
  };

  const loadMore = () => {
    if (loading || loadingMore || refreshing || !hasMore) return;
    setLoadingMore(true);
    loadPage(items.length, true);
  };

  const isUnread = (item: BidNotification) => {
    if (!lastSeenAt) return true;
    const created = item.created_at ? Date.parse(item.created_at) : 0;
    return created > Date.parse(lastSeenAt);
  };

  const renderItem = ({ item }: { item: BidNotification }) => {
    const visual = statusVisual(item.status);
    const Icon = visual.icon;
    const unread = isUnread(item);

    return (
      <TouchableOpacity
        className={`flex-row items-start gap-3 rounded-2xl border bg-white p-4 ${
          unread ? "border-primary/25" : "border-border"
        }`}
        activeOpacity={0.75}
        onPress={() =>
          router.push({ pathname: "/bid/[id]", params: { id: item.bid_id } })
        }
      >
        <View
          className={`h-10 w-10 items-center justify-center rounded-xl ${visual.bg}`}
        >
          <Icon size={18} color={visual.color} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-row items-center gap-1.5">
              {unread ? (
                <View className="h-1.5 w-1.5 rounded-full bg-primary" />
              ) : null}
              <Text className="font-inter-bold text-[9px] uppercase tracking-[0.12em] text-secondary-foreground">
                {bidStatusLabel(item.status)}
              </Text>
            </View>
            <Text className="font-inter text-[10px] text-secondary-foreground">
              {formatDateTime(item.created_at)}
            </Text>
          </View>
          <Text
            className="font-inter-bold mt-1 text-[14px] leading-5 text-primary-foreground"
            numberOfLines={2}
          >
            {item.contract_title || "Procurement proposal"}
          </Text>
          <Text className="font-inter mt-1 text-[12px] leading-5 text-secondary-foreground">
            {statusMessage(item.status)}
          </Text>
        </View>

        <ChevronRight size={16} color="#94A3B8" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-border bg-background px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text className="font-inter-bold text-lg text-primary-foreground">
          Notifications
        </Text>
        <View style={{ width: 40 }} />
      </View>

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
              setError("");
              setLoading(true);
              setHasMore(true);
              loadPage(0, false);
            }}
          >
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.1em] text-danger">
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0138A8" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 40,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#0138A8" />
              </View>
            ) : undefined
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0138A8"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-[70px]">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white">
                <Bell size={20} color="#64748B" />
              </View>
              <Text className="font-inter-bold text-[13px] text-primary-foreground">
                No notifications yet
              </Text>
              <Text className="font-inter mt-1 text-center text-[11px] leading-4 text-secondary-foreground">
                Status changes on your bids will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
