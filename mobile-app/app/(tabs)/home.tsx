import { supabase } from "@/lib/supabase";
import {
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  Trophy,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomePage() {
  const [companyName, setCompanyName] = useState("Vendor");

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.company_name) {
        setCompanyName(user.user_metadata.company_name);
      }
    };

    fetchUserData();
  }, []);

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
            style={{ shadowColor: "#FBD219", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }}
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
            <Text className="font-inter-extrabold mb-0.5 text-[22px] text-primary-foreground">12</Text>
            <Text className="font-inter-semibold text-xs text-secondary-foreground">Active Bids</Text>
          </View>

          <View className="h-10 w-px bg-background" />

          <View className="flex-1 items-center">
            <View className="mb-2.5 h-11 w-11 items-center justify-center rounded-[14px] bg-[#FEF3C7]">
              <CircleDollarSign size={22} color="#D97706" />
            </View>
            <Text className="font-inter-extrabold mb-0.5 text-[22px] text-primary-foreground">3</Text>
            <Text className="font-inter-semibold text-xs text-secondary-foreground">Pending</Text>
          </View>

          <View className="h-10 w-px bg-background" />

          <View className="flex-1 items-center">
            <View className="mb-2.5 h-11 w-11 items-center justify-center rounded-[14px] bg-[#DCFCE7]">
              <Trophy size={22} color="#16A34A" />
            </View>
            <Text className="font-inter-extrabold mb-0.5 text-[22px] text-primary-foreground">8</Text>
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
          {/* Modern Opportunity Card 1 */}
          <TouchableOpacity
            className="rounded-3xl border border-background bg-white p-5"
            style={{ shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 }}
            activeOpacity={0.8}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="rounded-lg border border-border bg-background px-2.5 py-1.5">
                <Text className="font-inter-bold text-[11px] uppercase tracking-[0.5px] text-slate-600">
                  Dept. of Technology
                </Text>
              </View>
              <Text className="font-inter-semibold text-xs text-danger">Closes in 5d</Text>
            </View>

            <Text className="font-inter-bold mb-4 text-lg leading-6 text-primary-foreground">
              IT Infrastructure Upgrade Phase 2
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-2">
                <View className="rounded-[10px] bg-background px-3 py-1.5">
                  <Text className="font-inter-semibold text-[13px] text-slate-600">Hardware</Text>
                </View>
                <View className="rounded-[10px] bg-[#FEF3C7] px-3 py-1.5">
                  <Text className="font-inter-bold text-[13px] text-[#D97706]">₱50k - ₱100k</Text>
                </View>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                <ChevronRight size={18} color="#0138A8" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Modern Opportunity Card 2 */}
          <TouchableOpacity
            className="rounded-3xl border border-background bg-white p-5"
            style={{ shadowColor: "#64748B", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 }}
            activeOpacity={0.8}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="rounded-lg border border-border bg-background px-2.5 py-1.5">
                <Text className="font-inter-bold text-[11px] uppercase tracking-[0.5px] text-slate-600">
                  General Services
                </Text>
              </View>
              <Text className="font-inter-semibold text-xs text-danger">Closes in 12d</Text>
            </View>

            <Text className="font-inter-bold mb-4 text-lg leading-6 text-primary-foreground">
              Office Supplies Provisioning 2026
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-row gap-2">
                <View className="rounded-[10px] bg-background px-3 py-1.5">
                  <Text className="font-inter-semibold text-[13px] text-slate-600">Logistics</Text>
                </View>
                <View className="rounded-[10px] bg-[#FEF3C7] px-3 py-1.5">
                  <Text className="font-inter-bold text-[13px] text-[#D97706]">₱10k - ₱25k</Text>
                </View>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-background">
                <ChevronRight size={18} color="#0138A8" />
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}