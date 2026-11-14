import DotGrid from "@/components/ui/DotGrid";
import React from "react";
import { Image, Text, View } from "react-native";

export default function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
  brand = false,
  className = "",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  brand?: boolean;
  className?: string;
}) {
  return (
    <View
      className={`relative overflow-hidden border-b border-border bg-white px-6 pb-5 pt-2.5 ${className}`}
    >
      <DotGrid color="#0138A8" opacity={0.05} />

      {brand ? (
        <View className="mb-5 flex-row items-center gap-2.5">
          <View className="h-9 w-9 items-center justify-center rounded-xl border border-border bg-white">
            <Image
              source={require("../../assets/images/skledge-logo.png")}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </View>
          <View className="flex-1">
            <Text className="font-inter-black text-[13px] leading-none tracking-tight text-primary-foreground">
              SK-Ledge
            </Text>
            <Text className="font-inter-bold mt-1 text-[8px] uppercase tracking-[0.24em] text-primary">
              Vendor workspace
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1">
            <View className="h-1.5 w-1.5 rounded-full bg-tertiary" />
            <Text className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground">
              Batangas
            </Text>
          </View>
        </View>
      ) : null}

      <View className="flex-row items-end justify-between gap-4">
        <View className="flex-1">
          <View className="mb-2 flex-row items-center gap-2">
            <View className="h-1 w-5 rounded-full bg-tertiary" />
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </Text>
          </View>
          <Text
            className="font-inter-black text-[27px] leading-[32px] tracking-tight text-primary-foreground"
            numberOfLines={2}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text className="font-inter mt-1.5 text-[13px] leading-5 text-secondary-foreground">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}
