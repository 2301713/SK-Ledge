import ScreenHeader from "@/components/ui/ScreenHeader";
import { ProjectCardSkeleton } from "@/components/ui/Skeletons";
import {
  daysLeftLabel,
  fetchOpenProjects,
  formatPeso,
  getErrorMessage,
  uniqueCategories,
  type Project,
} from "@/lib/projects";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Inbox,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchOpportunities = useCallback(async () => {
    try {
      setProjects(await fetchOpenProjects());
    } catch (err) {
      setError(getErrorMessage(err, "Could not load opportunities."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    fetchOpenProjects()
      .then((data) => {
        if (active) setProjects(data);
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, "Could not load opportunities."));
        }
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchOpportunities();
  };

  const categories = useMemo(
    () => ["All", ...uniqueCategories(projects)],
    [projects],
  );

  const filteredData = useMemo(
    () =>
      projects.filter((item) => {
        const term = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !term ||
          item.name.toLowerCase().includes(term) ||
          item.location.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term);
        const matchesCategory =
          activeCategory === "All" || item.category === activeCategory;
        return matchesSearch && matchesCategory;
      }),
    [projects, searchQuery, activeCategory],
  );

  const renderItem = ({ item, index }: { item: Project; index: number }) => (
    <Animated.View
      entering={FadeInDown.duration(320).delay(Math.min(index, 5) * 40)}
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
      activeOpacity={0.75}
      onPress={() =>
        router.push({ pathname: "/opportunity/[id]", params: { id: item.id } })
      }
    >
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 flex-row items-center gap-2">
          <View className="h-1.5 w-1.5 rounded-full bg-primary" />
          <Text
            className="font-inter-bold text-[9px] uppercase tracking-[0.14em] text-secondary-foreground"
            numberOfLines={1}
          >
            {item.category}
          </Text>
        </View>
        <View className="rounded-full border border-border bg-secondary/50 px-2.5 py-1">
          <Text className="font-inter-bold text-[9px] uppercase tracking-[0.06em] text-secondary-foreground">
            {daysLeftLabel(item)}
          </Text>
        </View>
      </View>

      <Text className="font-inter-bold mt-2.5 text-[16px] leading-6 text-primary-foreground">
        {item.name}
      </Text>

      <View className="mt-3.5 flex-row items-center justify-between border-t border-border/70 pt-3">
        <View className="flex-1 flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color="#94A3B8" />
            <Text
              className="font-inter-medium text-[11px] text-secondary-foreground"
              numberOfLines={1}
            >
              {item.location}
            </Text>
          </View>
          <Text className="font-inter-extrabold text-[13px] text-primary">
            {formatPeso(item.budget)}
          </Text>
        </View>
        <View className="h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary">
          <ChevronRight size={15} color="#0138A8" />
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="bg-white" edges={["top"]} />

      <Animated.View entering={FadeIn.duration(350)}>
      <ScreenHeader
        eyebrow="Procurement Registry"
        title="Find contracts"
        subtitle={
          loading
            ? "Loading live procurements..."
            : `${projects.length} open procurement${projects.length === 1 ? "" : "s"} from the SK portal`
        }
      />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)}>
      <View className="px-6 pb-4 pt-4">
        <View className="h-12 flex-row items-center rounded-xl border border-border bg-white px-3.5">
          <Search size={17} color="#64748B" />
          <TextInput
            className="font-inter-medium ml-2.5 flex-1 text-[14px] text-primary-foreground"
            placeholder="Search project, barangay, category..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={10}>
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      </Animated.View>

      {categories.length > 2 ? (
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <View className="mb-4">
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className={`rounded-xl border px-3.5 py-2 ${
                  activeCategory === item
                    ? "border-primary bg-primary"
                    : "border-border bg-white"
                }`}
                onPress={() => setActiveCategory(item)}
                activeOpacity={0.75}
              >
                <Text
                  className={`font-inter-bold text-[10px] uppercase tracking-[0.08em] ${
                    activeCategory === item
                      ? "text-white"
                      : "text-secondary-foreground"
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        </Animated.View>
      ) : null}

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
              fetchOpportunities();
            }}
            activeOpacity={0.8}
          >
            <Text className="font-inter-bold text-[10px] uppercase tracking-[0.1em] text-danger">
              Try again
            </Text>
          </TouchableOpacity>
        </View>
      ) : loading && !refreshing ? (
        <View className="gap-3 px-6">
          {[0, 1, 2, 3].map((item) => (
            <ProjectCardSkeleton key={item} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0138A8"
              colors={["#0138A8"]}
            />
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-[60px]">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl border border-border bg-white">
                <Inbox size={21} color="#64748B" />
              </View>
              <Text className="font-inter-bold text-[13px] text-primary-foreground">
                No matching procurements
              </Text>
              <Text className="font-inter mt-1 text-center text-[11px] leading-4 text-secondary-foreground">
                {projects.length === 0
                  ? "No procurements are open for bidding right now."
                  : "Try a different keyword or category."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
