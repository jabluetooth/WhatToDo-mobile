import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "@/lib/theme";

function Shimmer({ width, height }: { width: DimensionValue; height: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, { width, height }, animatedStyle]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Shimmer width={64} height={18} />
      <Shimmer width="70%" height={20} />
      <Shimmer width="40%" height={14} />
      <Shimmer width="100%" height={40} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  block: {
    backgroundColor: colors.surfacePressed,
    borderRadius: radius.sm,
  },
});
