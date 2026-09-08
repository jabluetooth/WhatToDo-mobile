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
    scale.value = reducedMotion ? 1 : withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 250 });
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
  },
  bubbleFocused: {
    backgroundColor: colors.surfacePressed,
  },
});
