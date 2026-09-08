import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import type { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { useReducedMotion } from "@/lib/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Adds the dock's press-bounce to each tab button — the touch-driven equivalent of a
    mouse-hover magnify effect, since there's no persistent hover state on a touchscreen. */
export function DockTabButton({ style, onPressIn, onPressOut, pressColor: _pressColor, ref: _ref, ...rest }: BottomTabBarButtonProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        if (!reducedMotion) scale.value = withSpring(0.82, { damping: 12, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) scale.value = withSpring(1, { damping: 10, stiffness: 300 });
        onPressOut?.(e);
      }}
    />
  );
}
