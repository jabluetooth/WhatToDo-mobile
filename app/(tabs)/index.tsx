import { useCallback, useEffect, useRef, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { FILTERS, FilterDrawer, type PlatformFilter } from "@/components/FilterDrawer";
import { TextScramble } from "@/components/TextScramble";
import { ApiError, addFavorite, fetchRandomIdea } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDailyReminder } from "@/lib/useDailyReminder";
import { setIdeaGenerateHandler } from "@/lib/ideaGenerate";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { useSwipeGesture } from "@/lib/useSwipeGesture";
import type { RandomIdea } from "@/lib/types";

const QUEUE_BUFFER = 2;

export default function IdeasScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { token } = useAuth();
  const reminder = useDailyReminder();
  const [queue, setQueue] = useState<RandomIdea[]>([]);
  const [capReached, setCapReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const fetchingRef = useRef(false);
  const prevTitleRef = useRef<string | undefined>(undefined);

  const front = queue[0];

  useEffect(() => {
    if (front && front.title !== prevTitleRef.current) {
      prevTitleRef.current = front.title;
      setPlayCount((c) => c + 1);
    }
  }, [front]);

  const replenish = useCallback(async () => {
    if (!token || fetchingRef.current || capReached) return;
    fetchingRef.current = true;
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

  const swipeRight = useCallback(() => {
    setQueue((current) => {
      const [swiped, ...rest] = current;
      if (swiped && token) addFavorite(token, swiped).catch(() => setError("Couldn't save that favorite."));
      return rest;
    });
  }, [token]);

  const swipeLeft = useCallback(() => {
    setQueue((current) => current.slice(1));
  }, []);

  const { gesture, animatedStyle, flyOut } = useSwipeGesture({ onSwipeRight: swipeRight, onSwipeLeft: swipeLeft });

  useEffect(() => {
    setIdeaGenerateHandler(() => {
      if (front && !capReached) flyOut(-1, swipeLeft);
    });
    return () => setIdeaGenerateHandler(null);
  }, [front, capReached, flyOut, swipeLeft]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.poster, animatedStyle]}>
          {capReached ? (
            <Animated.View entering={FadeIn.duration(300)} style={styles.capMessage}>
              <Text style={styles.promptHeadline}>You&rsquo;ve explored today&rsquo;s ideas</Text>
              <Text style={styles.promptSubtext}>Come back tomorrow for a fresh batch.</Text>
            </Animated.View>
          ) : (
            <View style={styles.posterInner}>
              {front ? <Badge label={front.platformTag} /> : null}
              <TextScramble
                text={front ? front.title : "idea"}
                play={playCount}
                loading={!front}
                style={styles.title}
              />
              {front ? (
                <View key={playCount} style={styles.supportingText}>
                  <Animated.Text entering={FadeInUp.delay(300).duration(400)} style={styles.targetUser}>
                    {front.targetUser}
                  </Animated.Text>
                  <Animated.Text entering={FadeInUp.delay(450).duration(400)} style={styles.description}>
                    {front.description}
                  </Animated.Text>
                </View>
              ) : null}
            </View>
          )}
        </Animated.View>
      </GestureDetector>

      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable style={styles.filterTrigger} onPress={() => setFilterDrawerOpen(true)}>
          <Feather name="sliders" size={14} color={colors.foregroundMuted} />
          <Text style={styles.filterTriggerLabel}>{FILTERS.find((f) => f.value === filter)?.label}</Text>
        </Pressable>

        <Pressable
          onPress={reminder.toggle}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={reminder.enabled ? "Daily reminder on" : "Daily reminder off"}
          accessibilityHint="Toggles a daily reminder notification"
        >
          <Feather
            name={reminder.enabled ? "bell" : "bell-off"}
            size={20}
            color={reminder.enabled ? colors.foreground : colors.foregroundMuted}
          />
        </Pressable>
      </View>

      <FilterDrawer
        visible={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filter={filter}
        onChange={changeFilter}
      />

      {front ? (
        <View style={[styles.bottomActions, { paddingBottom: tabBarHeight + spacing.md }]}>
          <Button
            variant="secondary"
            style={styles.flexButton}
            icon={<Feather name="x" size={16} color={colors.foreground} />}
            onPress={() => flyOut(-1, swipeLeft)}
          >
            Skip
          </Button>
          <Button
            style={styles.flexButton}
            icon={<Ionicons name="star" size={16} color={colors.background} />}
            onPress={() => flyOut(1, swipeRight)}
          >
            Favorite
          </Button>
        </View>
      ) : null}

      {error || reminder.error ? (
        <View style={[styles.errorContainer, { top: insets.top + spacing.xxl }]}>
          <Text style={styles.error}>{error ?? reminder.error}</Text>
          {/* Only the "stuck with no card at all" case is a dead end — an error alongside a
              visible card (e.g. a failed favorite) still has working Skip/Favorite buttons. */}
          {error && !front && !capReached ? (
            <Pressable onPress={() => replenish()} hitSlop={8}>
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  poster: {
    flex: 1,
  },
  posterInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  capMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  title: {
    ...typography.display,
    color: colors.foreground,
    textAlign: "center",
    marginTop: spacing.md,
  },
  targetUser: {
    ...typography.caption,
    color: colors.foregroundMuted,
    fontStyle: "italic",
    textAlign: "center",
  },
  description: {
    ...typography.body,
    color: colors.foregroundMuted,
    textAlign: "center",
  },
  supportingText: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  filterTriggerLabel: {
    ...typography.caption,
    color: colors.foregroundMuted,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  flexButton: {
    flex: 1,
  },
  promptHeadline: {
    ...typography.heading,
    color: colors.foreground,
    textAlign: "center",
  },
  promptSubtext: {
    ...typography.body,
    color: colors.foregroundMuted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  errorContainer: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    alignItems: "center",
    gap: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
  retryLabel: {
    ...typography.caption,
    color: colors.foreground,
    fontFamily: "Inter_600SemiBold",
  },
});
