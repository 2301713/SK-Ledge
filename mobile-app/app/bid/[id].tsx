import StatusBadge from "@/components/ui/StatusBadge";
import {
  bidStatusLabel,
  canWithdrawBid,
  fetchBidById,
  fetchBidEvents,
  formatDate,
  formatPeso,
  getErrorMessage,
  withdrawBid,
  type BidDetail,
  type BidEvent,
} from "@/lib/projects";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Calendar,
  CircleAlert,
  Clock,
  FileText,
  PhilippinePeso as Peso,
  Undo2,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const resolveProposalPath = (bid: BidDetail) => {
  if (bid.proposal_path) return bid.proposal_path;
  if (!bid.proposal_url) return null;
  return bid.proposal_url.match(/\/proposals\/([^?]+)/)?.[1] ?? null;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "\u2014";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

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

export default function BidDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [bid, setBid] = useState<BidDetail | null>(null);
  const [events, setEvents] = useState<BidEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [openingProposal, setOpeningProposal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    let active = true;

    if (!id) return;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return;
        if (!data.user) throw new Error("Please sign in again.");
        return fetchBidById(data.user.id, id);
      })
      .then((row) => {
        if (!active || !row) return;
        setBid(row);

        // A missing/unreadable history must not block the bid itself.
        return fetchBidEvents(row.id)
          .then((rows) => {
            if (active) setEvents(rows);
          })
          .catch(() => {
            if (active) setEvents([]);
          });
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err, "Could not load this bid."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Keep the detail and its timeline current while the vendor is on the screen.
  useEffect(() => {
    if (!id) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    const subscribe = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      channel = supabase
        .channel(`vendor-bid-${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "bids",
            filter: `id=eq.${id}`,
          },
          () => {
            fetchBidById(user.id, id)
              .then((row) => {
                if (!cancelled) setBid(row);
              })
              .catch(() => {});

            fetchBidEvents(id)
              .then((rows) => {
                if (!cancelled) setEvents(rows);
              })
              .catch(() => {});
          },
        )
        .subscribe();
    };

    subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    if (!bid) setLoading(true);
    setRefreshing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      const [row, eventRows] = await Promise.all([
        fetchBidById(user.id, id),
        fetchBidEvents(id).catch(() => [] as BidEvent[]),
      ]);
      setBid(row);
      setEvents(eventRows);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this bid."));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const openProposal = async () => {
    if (!bid) return;
    const path = resolveProposalPath(bid);
    if (!path) {
      Alert.alert(
        "No proposal document",
        "No proposal document is attached to this bid.",
      );
      return;
    }

    setOpeningProposal(true);
    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from("proposals")
        .createSignedUrl(path, 120);

      if (signedUrlError || !data?.signedUrl) {
        throw new Error(
          signedUrlError?.message ??
            "Could not create a link to your proposal.",
        );
      }

      await Linking.openURL(data.signedUrl);
    } catch (err) {
      Alert.alert(
        "Could not open proposal",
        getErrorMessage(err, "Please try again."),
      );
    } finally {
      setOpeningProposal(false);
    }
  };

  const confirmWithdraw = () => {
    if (!bid) return;

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

              setWithdrawing(true);
              await withdrawBid(bid.id, user.id);
              setBid((current) =>
                current ? { ...current, status: "withdrawn" } : current,
              );
              fetchBidEvents(bid.id).then(setEvents).catch(() => {});
            } catch (err) {
              Alert.alert(
                "Withdrawal failed",
                getErrorMessage(err, "Please try again."),
              );
            } finally {
              setWithdrawing(false);
            }
          },
        },
      ],
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
          Bid Details
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {!id ? (
        <View className="flex-1 items-center justify-center p-6">
          <CircleAlert size={34} color="#DC2626" />
          <Text className="font-inter-semibold mt-3 text-center text-base leading-6 text-secondary-foreground">
            Missing bid reference.
          </Text>
          <TouchableOpacity
            className="mt-5 rounded-xl bg-primary px-5 py-2.5"
            onPress={() => router.back()}
          >
            <Text className="font-inter-semibold text-white">Go back</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#0138A8" />
        </View>
      ) : !bid ? (
        <View className="flex-1 items-center justify-center p-6">
          <CircleAlert size={34} color="#DC2626" />
          <Text className="font-inter-semibold mt-3 text-center text-base leading-6 text-secondary-foreground">
            {error || "This bid is no longer available."}
          </Text>
          <TouchableOpacity
            className="mt-5 rounded-xl bg-primary px-5 py-2.5"
            onPress={refresh}
          >
            <Text className="font-inter-semibold text-white">Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#0138A8"
            />
          }
        >
          <View className="mb-6 flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-primary">
                {bid.vendor_name || "Your company"}
              </Text>
              <Text className="font-inter-extrabold mt-2 text-2xl tracking-tight text-primary-foreground">
                {bid.contract_title || "Procurement proposal"}
              </Text>
              {bid.department ? (
                <Text className="font-inter mt-1 text-[13px] text-secondary-foreground">
                  {bid.department}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={bidStatusLabel(bid.status)} />
          </View>

          <View className="mb-6 rounded-2xl border border-primary/15 bg-primary/[0.04] p-5">
            <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-primary">
              Bid amount
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.6}
              className="font-inter-black mt-2 text-[30px] tracking-tight text-primary-foreground"
            >
              {formatPeso(bid.amount_php)}
            </Text>
          </View>

          <View className="mb-6 gap-3">
            <InfoRow
              icon={Clock}
              label="Estimated timeline"
              value={bid.timeline || "Not provided"}
            />
            <InfoRow
              icon={Calendar}
              label="Submitted"
              value={formatDate(bid.submitted_on || bid.created_at)}
            />
            <InfoRow
              icon={Peso}
              label="Status"
              value={bidStatusLabel(bid.status)}
            />
          </View>

          {events.length > 0 ? (
            <View className="mb-6">
              <Text className="font-inter-bold mb-3 text-lg text-primary-foreground">
                Status timeline
              </Text>
              <View className="rounded-2xl border border-border bg-white p-4">
                {events.map((event, index) => {
                  const isLatest = index === events.length - 1;
                  const label =
                    index === 0 && !event.previous_status
                      ? "Submitted"
                      : bidStatusLabel(event.status);

                  return (
                    <View key={event.id} className="flex-row gap-3">
                      <View className="items-center">
                        <View
                          className={`mt-1 h-2.5 w-2.5 rounded-full ${
                            isLatest ? "bg-primary" : "bg-border"
                          }`}
                        />
                        {!isLatest ? (
                          <View className="mt-1 w-px flex-1 bg-border" />
                        ) : null}
                      </View>
                      <View
                        className={`flex-1 ${isLatest ? "" : "pb-5"}`}
                      >
                        <View className="flex-row items-center gap-2">
                          <Text className="font-inter-bold text-[13px] text-primary-foreground">
                            {label}
                          </Text>
                          {isLatest ? (
                            <Text className="font-inter-bold text-[8px] uppercase tracking-[0.12em] text-primary">
                              Latest
                            </Text>
                          ) : null}
                        </View>
                        <Text className="font-inter mt-0.5 text-[11px] text-secondary-foreground">
                          {formatDateTime(event.created_at)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          {bid.notes ? (
            <View className="mb-6">
              <Text className="font-inter-bold mb-2 text-lg text-primary-foreground">
                Additional notes
              </Text>
              <Text className="font-inter text-[15px] leading-6 text-slate-600">
                {bid.notes}
              </Text>
            </View>
          ) : null}

          <View className="mb-6 rounded-2xl border border-border bg-white p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <FileText size={14} color="#0138A8" />
              <Text className="font-inter-bold text-[9px] uppercase tracking-[0.16em] text-secondary-foreground">
                Technical proposal
              </Text>
            </View>

            {resolveProposalPath(bid) ? (
              <TouchableOpacity
                className="flex-row items-center justify-center gap-2 rounded-xl bg-primary py-3.5"
                onPress={openProposal}
                disabled={openingProposal}
                activeOpacity={0.8}
              >
                {openingProposal ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <FileText size={16} color="#FFFFFF" />
                    <Text className="font-inter-bold text-[13px] text-white">
                      Open proposal PDF
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Text className="font-inter text-[12px] leading-5 text-secondary-foreground">
                No proposal document is attached to this bid.
              </Text>
            )}
          </View>

          {canWithdrawBid(bid.status) ? (
            <TouchableOpacity
              className="flex-row items-center justify-center gap-2 rounded-xl border border-danger/20 bg-white py-3.5"
              onPress={confirmWithdraw}
              disabled={withdrawing}
              activeOpacity={0.75}
            >
              {withdrawing ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <>
                  <Undo2 size={15} color="#DC2626" />
                  <Text className="font-inter-bold text-[11px] uppercase tracking-[0.12em] text-danger">
                    Withdraw bid
                  </Text>
                </>
              )}
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
