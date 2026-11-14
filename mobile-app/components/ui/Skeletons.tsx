import Skeleton from "@/components/ui/Skeleton";
import React from "react";
import { View } from "react-native";

export function ProjectCardSkeleton() {
  return (
    <View className="rounded-2xl border border-border bg-white p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Skeleton className="h-2.5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </View>

      <Skeleton className="mt-3 h-4 w-[85%] rounded-md" />
      <Skeleton className="mt-2 h-4 w-[55%] rounded-md" />

      <View className="mt-4 flex-row items-center justify-between border-t border-border/70 pt-3">
        <View className="flex-row items-center gap-3">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </View>
        <Skeleton className="h-7 w-7 rounded-lg" />
      </View>
    </View>
  );
}

export function BidCardSkeleton() {
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-white">
      <View className="flex-row items-start justify-between gap-3 px-4 pt-4">
        <View className="flex-1">
          <Skeleton className="h-2.5 w-24 rounded-full" />
          <Skeleton className="mt-2.5 h-4 w-[85%] rounded-md" />
          <Skeleton className="mt-1.5 h-4 w-[55%] rounded-md" />
        </View>
        <Skeleton className="h-6 w-20 rounded-full" />
      </View>

      <View className="mt-4 flex-row items-end justify-between border-t border-border/70 px-4 py-3">
        <View>
          <Skeleton className="h-2 w-16 rounded-md" />
          <Skeleton className="mt-2 h-3 w-20 rounded-md" />
        </View>
        <View className="items-end">
          <Skeleton className="h-2 w-16 rounded-md" />
          <Skeleton className="mt-2 h-5 w-24 rounded-md" />
        </View>
      </View>
    </View>
  );
}

export function OpportunityDetailsSkeleton() {
  return (
    <>
      <View className="mb-5 flex-row gap-2">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
      </View>

      <Skeleton className="h-7 w-[90%] rounded-md" />
      <Skeleton className="mt-2 h-7 w-[55%] rounded-md" />

      <View className="mt-4 flex-row items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-full" />
        <Skeleton className="h-3.5 w-32 rounded-md" />
      </View>

      <View className="mt-6 gap-3">
        {[0, 1, 2].map((row) => (
          <View
            key={row}
            className="flex-row items-center rounded-2xl border border-border bg-white px-4 py-3.5"
          >
            <Skeleton className="mr-3 h-10 w-10 rounded-xl" />
            <View className="flex-1">
              <Skeleton className="h-2.5 w-28 rounded-md" />
              <Skeleton className="mt-2 h-4 w-36 rounded-md" />
            </View>
          </View>
        ))}
      </View>

      <View className="mt-7">
        <Skeleton className="h-4 w-28 rounded-md" />
        <Skeleton className="mt-3 h-3.5 w-full rounded-md" />
        <Skeleton className="mt-2 h-3.5 w-full rounded-md" />
        <Skeleton className="mt-2 h-3.5 w-[70%] rounded-md" />
      </View>
    </>
  );
}

export function SubmitBidSkeleton() {
  return (
    <>
      <View className="mb-5 rounded-2xl border border-border bg-white p-4">
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="mt-3 h-4 w-[80%] rounded-md" />
        <Skeleton className="mt-2 h-3 w-40 rounded-md" />
      </View>

      {[0, 1].map((field) => (
        <View key={field} className="mb-5">
          <Skeleton className="mb-2 h-3 w-36 rounded-md" />
          <Skeleton className="h-14 w-full rounded-2xl" />
        </View>
      ))}

      <View className="mb-5">
        <Skeleton className="mb-2 h-3 w-40 rounded-md" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </View>

      <View className="mb-5">
        <Skeleton className="mb-2 h-3 w-44 rounded-md" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </View>
    </>
  );
}

export function ProfileDetailsSkeleton() {
  return (
    <>
      <View className="rounded-2xl border border-border bg-white p-4">
        <View className="flex-row items-center justify-between gap-3 border-b border-border/70 pb-3.5">
          <View>
            <Skeleton className="h-2.5 w-24 rounded-full" />
            <Skeleton className="mt-2 h-4 w-40 rounded-md" />
          </View>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </View>

        {[0, 1, 2, 3].map((row) => (
          <View
            key={row}
            className="flex-row items-center border-b border-border/70 py-3 last:border-b-0"
          >
            <Skeleton className="mr-3 h-9 w-9 rounded-lg" />
            <View className="flex-1">
              <Skeleton className="h-2 w-16 rounded-md" />
              <Skeleton className="mt-2 h-3 w-32 rounded-md" />
            </View>
          </View>
        ))}
      </View>

      <Skeleton className="mt-4 h-24 rounded-2xl" />
    </>
  );
}
