import { useEffect, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { colors, radius } from "@/lib/theme";

interface AnimatedTabIconProps {
  focused: boolean;
  children: ReactNode;
}

/** Circular avatar-bubble backdrop per tab, matching MessageDock's character-avatar look. */
export function AnimatedTabIcon({ focused, children }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    scale.value = reducedMotion ? 1 : withSpring(focused ? 1.15 : 1, { damping: 14, stiffness: 400 });
  }, [focused, reducedMotion, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.bubble, focused && styles.bubbleFocused, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    // A flat `colors.surface` (#151517) sat here almost invisibly — it's actually *darker* than
    // the pill it sits on (`colors.surfaceElevated`, #1C1C1F), reading as a faint recess instead
    // of a raised bubble. White-at-low-opacity (this app's own elevation language — see DockGlow,
    // border/borderStrong) stays visibly lighter than whatever surface it's drawn over instead.
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleFocused: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: colors.borderStrong,
  },
});
