import { forwardRef } from "react";
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  LinearTransition,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// ─── Tokens ───────────────────────────────────────────────────────────────────
// The web app's one easing (components/fx/Reveal.tsx's EASE): fast out, long settle. Every
// timing here uses it, and every animation honours the OS "Reduce Motion" setting.

export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const system = ReduceMotion.System;

export const TIMING = {
  press: { duration: 120, easing: Easing.out(Easing.quad), reduceMotion: system },
  release: { duration: 220, easing: EASE, reduceMotion: system },
  quick: { duration: 200, easing: EASE, reduceMotion: system },
  standard: { duration: 450, easing: EASE, reduceMotion: system },
  emphasis: { duration: 750, easing: EASE, reduceMotion: system },
} as const;

export const STAGGER_MS = 70;

// ─── Presets ──────────────────────────────────────────────────────────────────

/** Content arriving in place: fade in while rising (web's <Rise>, y 24 → 0, 0.8 s). */
export function enterRise(index = 0, delay = 0) {
  return FadeInUp.duration(800)
    .easing(EASE)
    .delay(delay + index * STAGGER_MS)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 24 }] })
    .reduceMotion(system);
}

/** Small things settling from above (tags, header chips). */
export function enterDrop(delay = 0) {
  return FadeInDown.duration(500)
    .easing(EASE)
    .delay(delay)
    .withInitialValues({ opacity: 0, transform: [{ translateY: -8 }] })
    .reduceMotion(system);
}

export const enterFade = FadeIn.duration(450).easing(EASE).reduceMotion(system);
export const exitFade = FadeOut.duration(200).reduceMotion(system);
export const layoutSoft = LinearTransition.duration(450).easing(EASE).reduceMotion(system);

// ─── Haptics ──────────────────────────────────────────────────────────────────

export type HapticKind = "none" | "selection" | "light" | "medium" | "heavy" | "success" | "warning";

export function fireHaptic(kind: HapticKind): void {
  const run = () => {
    switch (kind) {
      case "selection": return Haptics.selectionAsync();
      case "light": return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case "medium": return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case "heavy": return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      case "success": return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case "warning": return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      default: return undefined;
    }
  };
  run()?.catch(() => {});
}

// ─── Pressable ────────────────────────────────────────────────────────────────

const PRESS_SCALE = { subtle: 0.985, normal: 0.96, strong: 0.9 } as const;
const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export interface AnimatedPressableProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while pressed (web: active:scale-95). */
  scale?: keyof typeof PRESS_SCALE | number;
  /** Haptic fired when the press completes. */
  haptic?: HapticKind;
}

/** The app's tappable surface: a quick ease-out shrink under the finger, optional haptic. */
export const AnimatedPressable = forwardRef<View, AnimatedPressableProps>(function AnimatedPressable(
  { style, scale = "normal", haptic = "none", disabled, onPress, onPressIn, onPressOut, ...rest },
  ref,
) {
  const pressed = useSharedValue(0);
  const target = typeof scale === "number" ? scale : PRESS_SCALE[scale];
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - target) * pressed.value }],
    opacity: disabled ? 0.45 : 1,
  }));

  return (
    <AnimatedPressableBase
      ref={ref}
      disabled={disabled}
      onPressIn={(e) => {
        pressed.value = withTiming(1, TIMING.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withTiming(0, TIMING.release);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic !== "none") fireHaptic(haptic);
        onPress?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
});
