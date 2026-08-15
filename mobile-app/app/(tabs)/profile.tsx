import StatusBadge from "@/components/ui/StatusBadge";
import { supabase } from "@/lib/supabase";
import { CreditCard, LogOut } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Profile() {
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("Loading...");
  const [hasPaymentMethod] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.user_metadata?.company_name) {
        setCompanyName(user.user_metadata.company_name);
      } else {
        setCompanyName("Unknown Company");
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-primary" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: "#F8FAFC" }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER */}
        <View className="flex-row items-center bg-primary px-6 pb-[50px] pt-5">
          <View
            className="h-[72px] w-[72px] items-center justify-center rounded-full bg-primary"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 }}
          >
            <Text className="font-inter-extrabold text-[28px] text-white">
              {companyName ? companyName.charAt(0).toUpperCase() : "V"}
            </Text>
          </View>

          <View className="ml-4 flex-1">
            <Text className="font-inter-extrabold mb-2 text-[22px] text-white">
              {companyName}
            </Text>
            <StatusBadge status="verified" showDot />
          </View>
        </View>

        {/* MAIN BODY CONTENT */}
        <View className="flex-1 rounded-t-[30px] bg-background pb-10 pt-[30px]">
          {/* PAYMENT CARD */}
          <View
            className="mx-5 rounded-3xl border border-border bg-white p-5"
            style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 }}
          >
            <View className="mb-5 flex-row items-center">
              <View className="mr-3.5 h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-background">
                <CreditCard size={20} color="#0138A8" />
              </View>
              <View>
                <Text className="font-inter-extrabold text-[15px] text-primary">
                  Payout Details
                </Text>
                <Text className="font-inter mt-0.5 text-[13px] text-secondary-foreground">
                  Banking & verification
                </Text>
              </View>
            </View>

            <View className="mb-5 rounded-2xl border border-border bg-background p-4">
              {hasPaymentMethod ? (
                <View>
                  <Text className="font-inter-semibold mb-1 text-[15px] text-slate-700">
                    Account: **** 1234
                  </Text>
                  <Text className="font-inter-semibold text-[15px] text-slate-700">
                    Bank: Mock Bank
                  </Text>
                </View>
              ) : (
                <View>
                  <Text className="font-inter-bold mb-1.5 text-[15px] text-slate-600">
                    No banking credentials attached.
                  </Text>
                  <Text className="font-inter text-[13px] leading-[18px] text-secondary-foreground">
                    Connect your business banking to clear verification and
                    accept direct contract deposits.
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              className="items-center rounded-[14px] bg-primary py-4"
              activeOpacity={0.85}
            >
              <Text className="font-inter-extrabold text-sm tracking-[0.5px] text-tertiary">
                {hasPaymentMethod
                  ? "Modify Financial Routing"
                  : "Link Verification Bank Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            className="mx-5 mt-8 flex-row items-center justify-center rounded-2xl border border-[#FFE4E6] bg-[#FFF1F2] py-3.5"
            onPress={handleLogout}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#EF4444" />
            ) : (
              <>
                <View className="mr-2.5 h-9 w-9 items-center justify-center rounded-[10px] bg-[#FFE4E6]">
                  <LogOut size={18} color="#EF4444" />
                </View>
                <Text className="font-inter-extrabold text-base text-danger">Log out</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}