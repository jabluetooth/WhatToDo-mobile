import { Pressable, StyleSheet, type PressableProps } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DockTabButtonProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
}

/** Press-bounce wrapper for each dock button — the touch-driven equivalent of a mouse-hover
    magnify effect, since there's no persistent hover state on a touchscreen. Sized to the
    platform minimum tappable target (44x44) regardless of the smaller icon bubble inside it. */
export function DockTabButton({ style, onPressIn, onPressOut, children, ...rest }: DockTabButtonProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      style={[styles.button, style, animatedStyle]}
      onPressIn={(e) => {
        if (!reducedMotion) scale.value = withSpring(0.9, { damping: 14, stiffness: 500 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) scale.value = withSpring(1, { damping: 12, stiffness: 500 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
