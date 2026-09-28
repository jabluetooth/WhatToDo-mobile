import { useEffect, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { TIMING } from "@/lib/motion";
import { colors, radius } from "@/lib/theme";

interface AnimatedTabIconProps {
  focused: boolean;
  children: ReactNode;
}

/**
 * Circle behind each dock icon. The active tab fills lime (the web nav's one lime pill) and grows
 * a touch; the rest stay clear. Colours are resolved here, outside the worklet.
 */
export function AnimatedTabIcon({ focused, children }: AnimatedTabIconProps) {
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(focused ? 1 : 0, TIMING.quick);
  }, [focused, on]);

  const idle = "rgba(243,241,234,0)";
  const lime = colors.accent;
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.value, [0, 1], [idle, lime]),
    transform: [{ scale: 1 + 0.06 * on.value }],
  }));

  return <Animated.View style={[styles.bubble, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  bubble: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
