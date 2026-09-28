import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { TIMING, enterFade, layoutSoft } from "@/lib/motion";
import { colors, radius, typography } from "@/lib/theme";

interface AnimatedTabIconProps {
  focused: boolean;
  /** Shown beside the icon on the active tab only. */
  label: string;
  children: ReactNode;
}

/**
 * One dock item. The active tab opens into a lime pill with its name (the web nav's one lime
 * button); the rest are just icons. The width change eases, and the fill fades between states.
 */
export function AnimatedTabIcon({ focused, label, children }: AnimatedTabIconProps) {
  const on = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    on.value = withTiming(focused ? 1 : 0, TIMING.quick);
  }, [focused, on]);

  const idle = "rgba(212,255,58,0)";
  const lime = colors.accent;
  const fill = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], [idle, lime]) }));

  return (
    <Animated.View layout={layoutSoft} style={[styles.pill, focused && styles.pillOpen, fill]}>
      {children}
      {focused && (
        <Animated.View entering={enterFade}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 44,
    minWidth: 44,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  pillOpen: { paddingHorizontal: 16 },
  label: { ...typography.label, fontSize: 11, color: colors.accentInk, letterSpacing: 1.8 },
});
