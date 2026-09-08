import { type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { colors, radius, spacing } from "@/lib/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary";
  children: ReactNode;
  /** Rendered left of the label with a fixed gap — pass a sized vector icon element. */
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({ onPress, disabled, loading, variant = "primary", children, icon, style }: ButtonProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        if (!reducedMotion) scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        if (!reducedMotion) scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[
        variant === "primary" ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.background : colors.foreground} />
      ) : typeof children === "string" ? (
        <View style={styles.content}>
          {icon}
          <Text style={variant === "primary" ? styles.primaryText : styles.secondaryText}>{children}</Text>
        </View>
      ) : (
        children
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: colors.foreground,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  primaryText: {
    color: colors.background,
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  secondaryText: {
    color: colors.foreground,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
