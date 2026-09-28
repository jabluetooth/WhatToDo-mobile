import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Keyframe,
  ReduceMotion,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";
import { Button } from "@/components/Button";
import { DiceIcon } from "@/components/fx";
import { DECOY_TITLES, posterSize } from "@/lib/decoys";
import { AnimatedPressable, EASE, enterDrop, enterFade, fireHaptic } from "@/lib/motion";
import { colors, fonts, typography } from "@/lib/theme";
import type { RandomIdea } from "@/lib/types";

/** The reel keeps spinning at least this long even when the API answers faster — a roll that
 *  lands instantly doesn't read as a roll at all (web: MIN_SPIN_MS). */
const MIN_SPIN_MS = 1500;
const REEL_TICK_MS = 80;
const SWIPE = 110;
const system = ReduceMotion.System;

export interface RollerProps {
  visible: boolean;
  /** The random-idea request is in flight. */
  loading: boolean;
  idea: RandomIdea | null;
  /** Bumped once per roll — replays the spin and the landing even when the same idea repeats. */
  drawNumber: number;
  error: string | null;
  /** The daily limit is used up. */
  capReached: boolean;
  saved: boolean;
  onSave: () => void;
  onReroll: () => void;
  /** Write the spec for the landed idea (web: "Build this"). */
  onBuild: () => void;
  onClose: () => void;
}

/**
 * Full-screen "draw" (web: components/IdeaRoller.tsx): the screen wipes up, a reel of
 * poster-sized titles spins, then a lime circle floods out and the real idea lands word by word.
 * Swipe the landed idea right to save it, left to roll again.
 */
export function Roller(props: RollerProps) {
  const { visible, onClose } = props;
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const curtain = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      curtain.value = height;
      curtain.value = withTiming(0, { duration: 750, easing: EASE, reduceMotion: system });
    } else if (mounted) {
      curtain.value = withTiming(-height, { duration: 500, easing: EASE, reduceMotion: system }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
  }, [visible]);

  const curtainStyle = useAnimatedStyle(() => ({ transform: [{ translateY: curtain.value }] }));

  if (!mounted) return null;
  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[styles.sheet, curtainStyle]}>
          <Stage {...props} />
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function Stage({ loading, idea, drawNumber, error, capReached, saved, onSave, onReroll, onBuild, onClose }: RollerProps) {
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  // Opened mid-request → start unsettled so the minimum spin applies to this draw too.
  const [settledDraw, setSettledDraw] = useState(() => (loading ? -1 : drawNumber));
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => setSettledDraw(drawNumber), reduced ? 0 : MIN_SPIN_MS);
    return () => clearTimeout(id);
  }, [drawNumber, reduced]);

  const spinning = loading || settledDraw !== drawNumber;
  const landed = !spinning && !error && !capReached && idea !== null;

  useEffect(() => {
    if (!spinning || reduced) return;
    const id = setInterval(() => setTick((t) => t + 1), REEL_TICK_MS);
    return () => clearInterval(id);
  }, [spinning, reduced]);

  useEffect(() => {
    if (landed) fireHaptic("success");
  }, [landed, drawNumber]);

  // Swipe the landed idea: right saves, left rolls again. It always settles back to centre.
  const dx = useSharedValue(0);
  const swipe = Gesture.Pan()
    .enabled(landed)
    .activeOffsetX([-12, 12])
    .onUpdate((e) => {
      dx.value = e.translationX * 0.6;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE) runOnJS(onSave)();
      else if (e.translationX < -SWIPE) runOnJS(onReroll)();
      dx.value = withTiming(0, { duration: 450, easing: EASE });
    });
  const swipeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dx.value }, { rotate: `${dx.value / 40}deg` }],
  }));

  const ink = landed ? colors.accentInk : colors.foreground;
  const drawLabel = `Nº ${String(drawNumber).padStart(4, "0")}`;
  const longestDecoy = DECOY_TITLES.reduce((a, b) => (b.length > a.length ? b : a));
  const reelSize = posterSize(longestDecoy, width, height);
  const decoy = DECOY_TITLES[(tick + drawNumber * 7) % DECOY_TITLES.length];

  return (
    <View style={StyleSheet.absoluteFill}>
      {spinning && !reduced && <Streaks width={width} height={height} />}
      {landed && <Flood key={drawNumber} width={width} height={height} />}

      <View style={[styles.stage, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <PulseDot color={landed ? colors.accentInk : colors.accent} pulsing={spinning} />
            <Text style={[styles.mono, { color: ink }]}>
              {spinning ? "Rolling" : "Draw"} {drawLabel}
            </Text>
          </View>
          {landed && idea && (
            <Animated.View key={`tag-${drawNumber}`} entering={enterDrop(500)} style={[styles.tag, { borderColor: ink }]}>
              <Text style={[styles.mono, { color: ink }]}>{idea.platformTag}</Text>
            </Animated.View>
          )}
          <AnimatedPressable
            scale="strong"
            haptic="light"
            onPress={onClose}
            hitSlop={12}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Feather name="x" size={22} color={ink} />
          </AnimatedPressable>
        </View>

        {/* Centre */}
        <GestureDetector gesture={swipe}>
          <Animated.View style={[styles.centre, swipeStyle]}>
            {spinning && (
              <View style={[styles.reelBox, { height: reelSize * 1.5 }]} accessibilityLabel="Rolling an idea">
                {reduced ? (
                  <Text style={[styles.reelText, { fontSize: reelSize, lineHeight: Math.round(reelSize * 1.25) }]}>ROLLING…</Text>
                ) : (
                  <Animated.Text
                    key={tick}
                    entering={reelFlick}
                    numberOfLines={1}
                    style={[styles.reelText, { fontSize: reelSize, lineHeight: Math.round(reelSize * 1.25) }]}
                  >
                    {decoy.toUpperCase()}
                  </Animated.Text>
                )}
              </View>
            )}

            {!spinning && capReached && (
              <Animated.View entering={enterFade} style={styles.message}>
                <Text style={styles.bigLine}>THAT'S TODAY'S DRAWS</Text>
                <Text style={styles.sub}>You've used today's rolls. Come back tomorrow for a fresh batch.</Text>
              </Animated.View>
            )}

            {!spinning && !capReached && error && (
              <Animated.View entering={enterFade} style={styles.message}>
                <Text style={styles.bigLine}>NO DICE.</Text>
                <Text style={styles.sub}>{error}</Text>
              </Animated.View>
            )}

            {landed && idea && <LandedIdea idea={idea} drawNumber={drawNumber} width={width} height={height} />}
          </Animated.View>
        </GestureDetector>

        {/* Footer */}
        <View style={styles.footer}>
          {landed && (
            <Animated.View key={`actions-${drawNumber}`} entering={actionsRise} style={styles.actions}>
              <Button
                variant="ink"
                onPress={onBuild}
                haptic="medium"
                trailing={<Feather name="arrow-right" size={18} color={colors.accent} />}
                accessibilityLabel="Build this: write its spec"
              >
                Build this
              </Button>
              <View style={styles.actionRow}>
                <AnimatedPressable
                  onPress={onSave}
                  disabled={saved}
                  haptic="success"
                  style={styles.outlineBtn}
                  accessibilityRole="button"
                  accessibilityLabel={saved ? "Saved" : "Save idea"}
                >
                  <Ionicons name={saved ? "checkmark" : "star-outline"} size={18} color={colors.accentInk} />
                  <Text style={styles.outlineTxt}>{saved ? "Saved" : "Save"}</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  onPress={onReroll}
                  haptic="light"
                  style={styles.outlineBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Roll again"
                >
                  <DiceIcon size={19} color={colors.accentInk} />
                  <Text style={styles.outlineTxt}>Roll again</Text>
                </AnimatedPressable>
              </View>
              <Text style={styles.hint}>Swipe right to save · left to roll again</Text>
            </Animated.View>
          )}
          {!spinning && !capReached && error && (
            <Button onPress={onReroll} icon={<DiceIcon size={19} color={colors.accentInk} />}>
              Try again
            </Button>
          )}
          {!spinning && capReached && (
            <Button variant="secondary" onPress={onClose}>
              Close
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function LandedIdea({ idea, drawNumber, width, height }: { idea: RandomIdea; drawNumber: number; width: number; height: number }) {
  const size = posterSize(idea.title, width, height);
  const words = idea.title.toUpperCase().split(/\s+/);
  return (
    <View key={drawNumber} style={styles.landed} accessible accessibilityLabel={`${idea.title}. ${idea.targetUser}. ${idea.description}`}>
      <View style={styles.titleRow}>
        {words.map((w, i) => (
          <LandWord key={`${w}-${i}`} word={w} size={size} delay={150 + i * 70} />
        ))}
      </View>
      <Animated.Text entering={rise(450)} style={styles.target}>
        {idea.targetUser}
      </Animated.Text>
      <Animated.Text entering={rise(600)} numberOfLines={5} style={styles.desc}>
        {idea.description}
      </Animated.Text>
    </View>
  );
}

/** One word rising out of its own mask with a slight tilt, on the web's spring (240 / 17). */
function LandWord({ word, size, delay }: { word: string; size: number; delay: number }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(delay, withSpring(1, { stiffness: 240, damping: 17 }));
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - p.value) * size * 1.05 },
      { rotate: `${(1 - p.value) * 8}deg` },
      { scale: 0.9 + 0.1 * p.value },
    ],
  }));
  return (
    <View style={[styles.wordMask, { paddingVertical: size * 0.18, marginVertical: -size * 0.18 }]}>
      <Animated.Text style={[styles.word, { fontSize: size, lineHeight: Math.round(size * 1.25) }, style]}>{word}</Animated.Text>
    </View>
  );
}

/** The lime flood that marks the moment an idea lands: a circle opening from just above centre. */
function Flood({ width, height }: { width: number; height: number }) {
  const d = 2 * Math.hypot(width, height);
  const s = useSharedValue(0);
  useEffect(() => {
    s.value = withTiming(1, { duration: 800, easing: EASE, reduceMotion: system });
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", width: d, height: d, borderRadius: d / 2, left: width / 2 - d / 2, top: height * 0.45 - d / 2, backgroundColor: colors.accent },
        style,
      ]}
    />
  );
}

/** Speed streaks behind the spinning reel (web: the `streak` keyframes). */
function Streaks({ width, height }: { width: number; height: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(withTiming(-140, { duration: 400, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(y);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const h = height + 140;
  const verticals = Array.from({ length: Math.ceil(width / 47) }, (_, i) => i * 47 + 46);
  const horizontals = Array.from({ length: Math.ceil(h / 140) }, (_, i) => i * 140 + 140);
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: 0.07, height: h }, style]}>
      <Svg width={width} height={h}>
        {verticals.map((x) => (
          <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={h} stroke={colors.foreground} strokeWidth={1} />
        ))}
        {horizontals.map((yy) => (
          <Line key={`h${yy}`} x1={0} y1={yy} x2={width} y2={yy} stroke={colors.accent} strokeWidth={3} />
        ))}
      </Svg>
    </Animated.View>
  );
}

function PulseDot({ color, pulsing }: { color: string; pulsing: boolean }) {
  const o = useSharedValue(1);
  useEffect(() => {
    if (!pulsing) {
      cancelAnimation(o);
      o.value = withTiming(1, { duration: 150 });
      return;
    }
    o.value = withRepeat(withTiming(0.2, { duration: 300, easing: Easing.inOut(Easing.ease), reduceMotion: system }), -1, true);
    return () => cancelAnimation(o);
  }, [pulsing]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

// Each reel word: stretched and faint, snapping into focus (web: scaleY 1.35 → 1, opacity 0.25 → 1).
const reelFlick = new Keyframe({
  0: { opacity: 0.25, transform: [{ scaleY: 1.35 }] },
  100: { opacity: 1, transform: [{ scaleY: 1 }] },
}).duration(70);

const actionsRise = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 24 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: EASE },
})
  .duration(600)
  .delay(750)
  .reduceMotion(system);

function rise(delay: number) {
  return new Keyframe({
    0: { opacity: 0, transform: [{ translateY: 16 }] },
    100: { opacity: 1, transform: [{ translateY: 0 }], easing: EASE },
  })
    .duration(600)
    .delay(delay)
    .reduceMotion(system);
}

const styles = StyleSheet.create({
  sheet: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, overflow: "hidden" },
  stage: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  mono: { ...typography.label },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },

  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  reelBox: {
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(212,255,58,0.4)",
  },
  reelText: { fontFamily: fonts.display, color: colors.accent, textAlign: "center" },

  message: { alignItems: "center", gap: 14, paddingHorizontal: 8 },
  bigLine: { fontFamily: fonts.display, fontSize: 64, lineHeight: 80, color: colors.foreground, textAlign: "center" },
  sub: { ...typography.body, color: colors.muted, textAlign: "center" },

  landed: { alignItems: "center", width: "100%" },
  titleRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 10 },
  wordMask: { overflow: "hidden" },
  word: { fontFamily: fonts.display, color: colors.accentInk, textAlign: "center" },
  target: { fontFamily: fonts.sansSemibold, fontSize: 20, lineHeight: 26, color: colors.accentInk, textAlign: "center", marginTop: 18 },
  desc: { ...typography.body, color: colors.accentInk, opacity: 0.75, textAlign: "center", marginTop: 10, maxWidth: 520 },

  footer: { minHeight: 72, alignItems: "stretch", justifyContent: "flex-end" },
  actions: { gap: 14, alignItems: "stretch" },
  actionRow: { flexDirection: "row", gap: 10 },
  outlineBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accentInk,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlineTxt: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.accentInk },
  hint: { ...typography.label, fontSize: 10, color: colors.accentInk, opacity: 0.55, textAlign: "center" },
});
