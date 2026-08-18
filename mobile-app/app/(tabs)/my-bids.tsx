import StatusBadge from "@/components/ui/StatusBadge";
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
import { TABS } from "../../data/data";
import { supabase } from "../../lib/supabase";

type BidItem = {
  id: string;
  contract_title: string;
  department: string;
  status: string;
  submitted_on: string;
  amount: string;
};

export default function MyBidsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [bids, setBids] = useState<BidItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signedOut, setSignedOut] = useState(false);

  const fetchBids = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        setSignedOut(true);
        setBids([]);
        return;
      }
      setSignedOut(false);

      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setBids(data as BidItem[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBids();
  }, []);

  const filteredBids = bids.filter(
    (bid) => activeTab === "All" || bid.status === activeTab,
  );

  const renderItem = ({ item }: { item: BidItem }) => {
    return (
      <View
        className="rounded-3xl border border-border bg-white p-5"
        style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 }}
      >
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="font-inter-extrabold mb-1 text-[17px] leading-[22px] text-primary-foreground">
              {item.contract_title}
            </Text>
            <Text className="font-inter-medium text-[13px] text-secondary-foreground">
              {item.department}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View className="mb-4 h-px bg-background" />

        <View className="flex-row items-end justify-between">
          <View>
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.5px] text-secondary-foreground">
              Submitted On
            </Text>
            <Text className="font-inter-semibold mt-0.5 text-sm text-primary-foreground">
              {item.submitted_on}
            </Text>
          </View>
          <View className="items-end">
            <Text className="font-inter-semibold text-xs uppercase tracking-[0.5px] text-secondary-foreground">
              Your Bid Amount
            </Text>
            <Text className="font-inter-extrabold mt-0.5 text-xl text-primary">
              {item.amount}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      {/* HERO HEADER */}
      <View className="bg-primary px-6 pb-[50px] pt-2.5">
        <Text className="font-inter-extrabold text-[32px] tracking-tight text-white">
          My Bids
        </Text>
        <Text className="font-inter-medium mt-1.5 text-[15px] text-secondary-foreground">
          Track your proposal history
        </Text>
      </View>

      {/* OVERLAPPING BODY */}
      <View className="flex-1 rounded-t-[30px] bg-background pt-6">
        {/* TABS */}
        <View className="mx-6 mb-5 flex-row gap-1 rounded-2xl bg-border px-1.5 py-1.5">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 items-center justify-center rounded-xl py-3 ${
                activeTab === tab ? "bg-primary" : "bg-transparent"
              }`}
              style={activeTab === tab ? { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 } : undefined}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                className={`font-inter-semibold text-sm ${
                  activeTab === tab ? "font-inter-bold text-white" : "text-secondary-foreground"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LIST */}
        {loading ? (
          <View className="flex-1 items-center justify-center gap-3">
            <ActivityIndicator size="large" color="#003366" />
          </View>
        ) : (
          <FlatList
            data={filteredBids}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-[60px] px-6">
                <Text className="font-inter-medium text-center text-[15px] text-secondary-foreground">
                  {signedOut
                    ? "Please log in to view your bids."
                    : "No bids found in this category."}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
