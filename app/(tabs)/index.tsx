import { useCallback, useEffect, useRef, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { IdeaCard } from "@/components/IdeaCard";
import { SkeletonCard } from "@/components/Skeleton";
import { SwipeCard } from "@/components/SwipeCard";
import { TagChip } from "@/components/TagChip";
import { ApiError, addFavorite, fetchRandomIdea } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isDailyReminderEnabled, setDailyReminderEnabled } from "@/lib/notifications";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { PlatformTag, RandomIdea } from "@/lib/types";

const QUEUE_BUFFER = 2;
type PlatformFilter = PlatformTag | "all";
const FILTERS: { label: string; value: PlatformFilter }[] = [
  { label: "All", value: "all" },
  { label: "Web", value: "web" },
  { label: "Mobile", value: "mobile" },
];

export default function IdeasScreen() {
  const { token, user, signOut } = useAuth();
  const [queue, setQueue] = useState<RandomIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [capReached, setCapReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    isDailyReminderEnabled().then(setReminderEnabled);
  }, []);

  const replenish = useCallback(async () => {
    if (!token || fetchingRef.current || capReached) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchRandomIdea(token, filter === "all" ? undefined : filter);
      setQueue((current) => [...current, next]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setCapReached(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't load more ideas right now.");
      }
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [token, filter, capReached]);

  useEffect(() => {
    if (queue.length < QUEUE_BUFFER && !capReached) {
      replenish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replenish is stable enough per (token, filter, capReached), re-running on queue.length is the actual trigger
  }, [queue.length, capReached, replenish]);

  const changeFilter = (next: PlatformFilter) => {
    if (next === filter) return;
    setFilter(next);
    setCapReached(false);
    setQueue([]);
  };

  const swipeRight = useCallback(
    (idea: RandomIdea) => {
      setQueue((current) => current.slice(1));
      if (!token) return;
      addFavorite(token, idea).catch(() => setError("Couldn't save that favorite."));
    },
    [token]
  );

  const swipeLeft = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  const toggleReminder = async () => {
    const ok = await setDailyReminderEnabled(!reminderEnabled);
    if (ok) setReminderEnabled(!reminderEnabled);
    else setError("Enable notifications in your device settings to get a daily reminder.");
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const front = queue[0];
  const behind = queue[1];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>What To Do</Text>
          {user?.name ? <Text style={styles.greeting}>Hey, {user.name}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {user ? (
            user.image ? (
              <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )
          ) : null}
          <Pressable onPress={toggleReminder} hitSlop={8}>
            <Text style={styles.headerIcon}>{reminderEnabled ? "🔔" : "🔕"}</Text>
          </Pressable>
          <Pressable onPress={signOut} hitSlop={8}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TagChip key={f.value} label={f.label} selected={filter === f.value} onPress={() => changeFilter(f.value)} />
        ))}
      </View>

      <View style={styles.deck}>
        {front ? (
          <View>
            {behind ? (
              <View style={styles.behindCard} pointerEvents="none">
                <IdeaCard idea={behind} variant="detail" />
              </View>
            ) : null}
            <SwipeCard idea={front} onSwipeRight={() => swipeRight(front)} onSwipeLeft={swipeLeft} />
          </View>
        ) : capReached ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.prompt}>
            <Text style={styles.promptHeadline}>You've explored today's ideas</Text>
            <Text style={styles.promptSubtext}>Come back tomorrow for a fresh batch.</Text>
          </Animated.View>
        ) : loading ? (
          <SkeletonCard />
        ) : (
          <Animated.View entering={FadeIn.duration(300)} style={styles.prompt}>
            <Text style={styles.promptHeadline}>Stuck on thinking what to do?</Text>
            <Text style={styles.promptSubtext}>Swipe right to favorite, left to skip.</Text>
          </Animated.View>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  headerText: {
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.foreground,
  },
  greeting: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  headerIcon: {
    fontSize: 18,
  },
  signOut: {
    color: colors.muted,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  deck: {
    marginTop: spacing.md,
  },
  behindCard: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    opacity: 0.5,
    transform: [{ scale: 0.96 }],
  },
  prompt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  promptHeadline: {
    ...typography.heading,
    color: colors.foreground,
  },
  promptSubtext: {
    ...typography.body,
    color: colors.muted,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
});
