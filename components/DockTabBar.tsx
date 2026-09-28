import { StyleSheet, View } from "react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { AnimatedTabIcon } from "@/components/AnimatedTabIcon";
import { DockGlow } from "@/components/DockGlow";
import { DockTabButton } from "@/components/DockTabButton";
import { colors, radius, spacing } from "@/lib/theme";

const ICON_SIZE = 22;

/**
 * Fully custom bottom tab bar (expo-router's `tabBar` navigator prop) instead of layering
 * tabBarStyle/tabBarBackground/tabBarButton overrides onto the default one. Those three override
 * points still run through the library's own per-tab-item layout (flex:1 stretching per item,
 * justifyContent:"flex-start", padding built for icon+label stacking) — every dock bug so far
 * (labels appearing, icons pinned to the pill's top edge, gaps too wide, the pill not lining up
 * with its own buttons) came from fighting that layout instead of owning it.
 *
 * Here the pill and the button row are the same View tree, and the pill is sized from its own
 * content (row + padding) rather than a computed width — there's no separate background layer
 * that can drift out of sync with the buttons it's supposed to sit behind.
 */
export function DockTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + spacing.sm }]} pointerEvents="box-none">
      <View style={styles.shadowWrapper}>
        <View style={styles.pill}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <DockGlow />
          </View>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const focused = state.index === index;
            // Ink on the active tab's lime disc, muted cream elsewhere.
            const color = focused ? colors.accentInk : colors.muted;
            const label =
              options.tabBarAccessibilityLabel ??
              (typeof options.title === "string" ? options.title : route.name);

            const onPress = () => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            return (
              <DockTabButton
                key={route.key}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={label}
              >
                <AnimatedTabIcon focused={focused}>
                  {options.tabBarIcon?.({ focused, color, size: ICON_SIZE })}
                </AnimatedTabIcon>
              </DockTabButton>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  // Shadows and overflow:"hidden" fight each other on the same view (the clip cuts the shadow
  // off too) — the shadow lives on this outer wrapper, the rounded clip + fill on `pill` below.
  shadowWrapper: {
    borderRadius: radius.full,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 6,
    overflow: "hidden",
  },
});
