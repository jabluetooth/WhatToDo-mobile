import { useCallback, useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  Keyframe,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { AppHeader } from "@/components/AppHeader";
import { FILTERS, FilterDrawer, type PlatformFilter } from "@/components/FilterDrawer";
import { RiseWords } from "@/components/fx";
import { headlineSize } from "@/lib/decoys";
import { Marquee } from "@/components/roller/Marquee";
import { RollButton } from "@/components/roller/RollButton";
import { Roller } from "@/components/roller/Roller";
import { ApiError, fetchRandomIdea } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { setIdeaGenerateHandler } from "@/lib/ideaGenerate";
import { AnimatedPressable, EASE, enterRise, fireHaptic } from "@/lib/motion";
import { useFavorites } from "@/lib/stores/favorites";
import { promptFromIdea, useSpec } from "@/lib/stores/spec";
import { colors, fonts, typography } from "@/lib/theme";
import type { RandomIdea } from "@/lib/types";

const system = ReduceMotion.System;
const PIPELINE = ["Idea", "PRD", "Stack", "Code"];

/**
 * Ideas: the web app's hero, native. One big lime Roll button opens the full-screen draw; the
 * last idea you landed stays one tap away. Saving happens in the draw itself.
 */
export default function IdeasScreen() {
  const { width } = useWindowDimensions();
  const { token } = useAuth();
  const router = useRouter();
  const startSpec = useSpec((s) => s.start);
  const save = useFavorites((s) => s.save);
  const favorites = useFavorites((s) => s.items);

  const [filter, setFilter] = useState<PlatformFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [rollerOpen, setRollerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idea, setIdea] = useState<RandomIdea | null>(null);
  const [drawNumber, setDrawNumber] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capReached, setCapReached] = useState(false);
  const [lastIdea, setLastIdea] = useState<RandomIdea | null>(null);

  const saved = !!idea && favorites.some((f) => f.title === idea.title && f.description === idea.description);

  const roll = useCallback(async () => {
    if (!token || loading) return;
    setRollerOpen(true);
    if (capReached) return;
    setDrawNumber((n) => n + 1);
    setLoading(true);
    setError(null);
    try {
      const next = await fetchRandomIdea(token, filter === "all" ? undefined : filter);
      setIdea(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) setCapReached(true);
      else setError(err instanceof ApiError ? err.message : "Couldn't reach the idea machine. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [token, loading, capReached, filter]);

  // Tapping the dice tab while already here rolls, like the web's R key.
  useEffect(() => {
    setIdeaGenerateHandler(() => roll());
    return () => setIdeaGenerateHandler(null);
  }, [roll]);

  const onSave = async () => {
    if (!token || !idea || saved) return;
    const ok = await save(token, idea);
    fireHaptic(ok ? "success" : "warning");
  };

  // "Build this": close the draw and write the idea's spec (web: startPrdFromIdea).
  const build = () => {
    if (!token || !idea) return;
    void startSpec(token, promptFromIdea(idea), { platform: idea.platformTag }, idea);
    setLastIdea(idea);
    setRollerOpen(false);
    router.push("/spec");
  };

  const close = () => {
    setRollerOpen(false);
    if (idea && !error) setLastIdea(idea);
  };

  const reopenLast = () => {
    if (!lastIdea) return;
    setIdea(lastIdea);
    setError(null);
    setRollerOpen(true);
  };

  const changeFilter = (next: PlatformFilter) => {
    if (next === filter) return;
    setFilter(next);
    setCapReached(false);
  };

  const hs = headlineSize(width);
  const filterShort = filter === "all" ? "All" : filter === "web" ? "Web" : "Mobile";
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label ?? "All platforms";

  return (
    <View style={styles.container}>
      <Marquee />
      <Glow width={width} />

      <AppHeader
        right={
          <AnimatedPressable
            onPress={() => setFilterOpen(true)}
            scale="strong"
            haptic="selection"
            style={styles.filter}
            accessibilityRole="button"
            accessibilityLabel={`Platform: ${filterLabel}. Change`}
          >
            <Feather name="sliders" size={12} color={colors.muted} />
            <Text style={styles.filterTxt}>{filterShort}</Text>
          </AnimatedPressable>
        }
      />

      <View style={styles.hero}>
        <Animated.Text entering={enterRise(0, 100)} style={styles.kicker}>
          Stuck on what to build?
        </Animated.Text>

        <View style={styles.headline} accessible accessibilityRole="header" accessibilityLabel="What to do?">
          <RiseWords
            words={["WHAT", "TO", "DO"]}
            delay={150}
            step={100}
            wordStyle={[styles.headWord, { fontSize: hs, lineHeight: Math.round(hs * 1.25) }]}
            style={styles.headWords}
          />
          <Question size={hs} />
        </View>

        <Animated.View entering={popIn} style={styles.rollWrap}>
          <RollButton onPress={roll} disabled={!token} />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(1100).reduceMotion(system)} style={styles.below}>
          {lastIdea ? (
            <AnimatedPressable
              onPress={reopenLast}
              scale="subtle"
              haptic="light"
              style={styles.lastPill}
              accessibilityRole="button"
              accessibilityLabel={`Reopen your last idea, ${lastIdea.title}`}
            >
              <View style={styles.lastTag}>
                <Text style={styles.lastTagTxt}>LAST</Text>
              </View>
              <Text style={styles.lastTitle} numberOfLines={1}>{lastIdea.title}</Text>
              <Feather name="arrow-up-right" size={15} color={colors.muted} />
            </AnimatedPressable>
          ) : null}
          <AnimatedPressable
            onPress={() => router.push("/compose")}
            scale="strong"
            haptic="light"
            style={styles.ownLink}
            accessibilityRole="button"
            accessibilityLabel="Write your own idea"
          >
            <Text style={styles.ownTxt}>or write your own</Text>
          </AnimatedPressable>
        </Animated.View>
      </View>

      <PipelineRail bottom={18} width={width} />

      <FilterDrawer visible={filterOpen} onClose={() => setFilterOpen(false)} filter={filter} onChange={changeFilter} />

      <Roller
        visible={rollerOpen}
        loading={loading}
        idea={idea}
        drawNumber={drawNumber}
        error={error}
        capReached={capReached}
        saved={saved}
        onSave={onSave}
        onReroll={roll}
        onBuild={build}
        onClose={close}
      />
    </View>
  );
}

/** The lime "?" that pops in, then wobbles now and then (web: spring pop + `wobble` keyframes). */
function Question({ size }: { size: number }) {
  const r = useSharedValue(0);
  useEffect(() => {
    const swing = withSequence(
      withTiming(-10, { duration: 480 }),
      withTiming(8, { duration: 480 }),
      withTiming(-4, { duration: 480 }),
      withTiming(2, { duration: 480 }),
      withTiming(0, { duration: 480 }),
    );
    r.value = withDelay(3000, withRepeat(withSequence(swing, withTiming(0, { duration: 2400 })), -1, false));
    return () => cancelAnimation(r);
  }, [r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <Animated.View entering={questionPop}>
      <Animated.Text style={[styles.headWord, styles.question, { fontSize: size, lineHeight: Math.round(size * 1.25) }, style]}>?</Animated.Text>
    </Animated.View>
  );
}

/** A soft lime halo behind the Roll button (web: the hero's blurred accent circle). */
function Glow({ width }: { width: number }) {
  const size = width * 1.3;
  return (
    <View pointerEvents="none" style={[styles.glow, { width: size, height: size, left: (width - size) / 2 }]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.14} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#heroGlow)" />
      </Svg>
    </View>
  );
}

/** Idea → PRD → Stack → Code, with a lime pulse travelling the line (web: Hero's PipelineRail).
 *  On mobile the last three happen on the web, which "Continue on web" hands off to. */
function PipelineRail({ bottom, width }: { bottom: number; width: number }) {
  const railW = Math.min(width - 48, 340);
  const x = useSharedValue(0);
  useEffect(() => {
    x.value = withRepeat(withTiming(railW - 64, { duration: 2600, easing: Easing.inOut(Easing.ease), reduceMotion: system }), -1, true);
    return () => cancelAnimation(x);
  }, [railW, x]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <Animated.View
      entering={enterRise(0, 1300)}
      style={[styles.rail, { bottom, width: railW, left: (width - railW) / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.railLine} />
      <Animated.View style={[styles.railPulse, pulse]} />
      {PIPELINE.map((step) => (
        <Text key={step} style={styles.railStep}>{step}</Text>
      ))}
    </Animated.View>
  );
}

const popIn = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.6 }] },
  100: { opacity: 1, transform: [{ scale: 1 }], easing: EASE },
})
  .duration(700)
  .delay(750)
  .reduceMotion(system);

const questionPop = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0 }, { rotate: "-40deg" }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: "0deg" }], easing: EASE },
})
  .duration(700)
  .delay(600)
  .reduceMotion(system);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(21,21,18,0.8)",
  },
  filterTxt: { ...typography.label, color: colors.muted },

  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingBottom: 56 },
  kicker: { ...typography.label, color: colors.muted, letterSpacing: 3.3 },
  headline: { flexDirection: "row", alignItems: "flex-end", marginTop: 14 },
  headWords: { columnGap: 12 },
  headWord: { fontFamily: fonts.display, fontSize: 84, lineHeight: 105, color: colors.foreground },
  question: { color: colors.accent, marginLeft: 2 },
  rollWrap: { marginTop: 36 },
  below: { marginTop: 26, alignItems: "center", justifyContent: "center", gap: 10 },
  ownLink: { paddingVertical: 8, paddingHorizontal: 12 },
  ownTxt: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted, textDecorationLine: "underline" },
  lastPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    maxWidth: 320,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "rgba(21,21,18,0.85)",
  },
  lastTag: { backgroundColor: colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  lastTagTxt: { ...typography.label, fontSize: 10, color: colors.accentInk, letterSpacing: 1.6 },
  lastTitle: { flexShrink: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.foreground },

  glow: { position: "absolute", top: "30%" },

  rail: { position: "absolute", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  railLine: { position: "absolute", left: 8, right: 8, height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  railPulse: { position: "absolute", left: 0, width: 64, height: 1.5, backgroundColor: colors.accent, opacity: 0.8 },
  railStep: { ...typography.label, fontSize: 10, color: colors.muted, backgroundColor: colors.background, paddingHorizontal: 8 },
});
