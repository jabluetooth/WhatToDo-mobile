import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { AnimatedPressable, TIMING } from "@/lib/motion";
import { colors, typography } from "@/lib/theme";

const ICON_SIZE = 22;
const MARK_W = 22;

/**
 * A flat, full-width bottom bar in the web's type: each tab is an icon over a small mono label,
 * and a short lime rule slides to the active one. No floating pill, no fills — the lime is the
 * only thing that says "you are here".
 *
 * Rendered in the page flow (not floating), so screens end above it and need no bottom padding.
 */
export function DockTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const [itemW, setItemW] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!itemW) return;
    x.value = withTiming(state.index * itemW + (itemW - MARK_W) / 2, TIMING.standard);
  }, [state.index, itemW, x]);

  const mark = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], opacity: itemW ? 1 : 0 }));

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
      onLayout={(e) => setItemW(e.nativeEvent.layout.width / state.routes.length)}
    >
      <Animated.View style={[styles.mark, mark]} pointerEvents="none" />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.foreground : colors.muted;
        const label = typeof options.title === "string" ? options.title : route.name;

        const onPress = () => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <AnimatedPressable
            key={route.key}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
            scale="strong"
            haptic="selection"
            style={styles.item}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
          >
            {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </AnimatedPressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    paddingTop: 10,
  },
  mark: { position: "absolute", top: -1, left: 0, width: MARK_W, height: 2, borderRadius: 1, backgroundColor: colors.accent },
  item: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6, minHeight: 48 },
  label: { ...typography.label, fontSize: 10, letterSpacing: 1.8 },
});
