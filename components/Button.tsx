import { type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { AnimatedPressable, type HapticKind } from "@/lib/motion";
import { colors, fonts, radius, spacing } from "@/lib/theme";

type Variant = "primary" | "secondary" | "ink";

interface ButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /**
   * primary: lime pill with ink text (the one action that matters on a screen).
   * secondary: hairline outline pill.
   * ink: ink pill with lime text, for use on top of a lime flood (web's "Build this").
   */
  variant?: Variant;
  children: ReactNode;
  /** Rendered left of the label with a fixed gap — pass a sized vector icon element. */
  icon?: ReactNode;
  /** Rendered right of the label (e.g. an arrow). */
  trailing?: ReactNode;
  haptic?: HapticKind;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Pill buttons matching the web app's rounded-full controls. */
export function Button({
  onPress,
  disabled,
  loading,
  variant = "primary",
  children,
  icon,
  trailing,
  haptic = "light",
  accessibilityLabel,
  style,
}: ButtonProps) {
  const textColor = variant === "primary" ? colors.accentInk : variant === "ink" ? colors.accent : colors.foreground;
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled || loading}
      haptic={haptic}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
      accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      style={[styles.base, styles[variant], style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : typeof children === "string" ? (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, { color: textColor }]}>{children}</Text>
          {trailing}
        </View>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.accent },
  ink: { backgroundColor: colors.accentInk },
  secondary: { borderWidth: 1.5, borderColor: colors.lineStrong },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { fontFamily: fonts.sansSemibold, fontSize: 16 },
});
