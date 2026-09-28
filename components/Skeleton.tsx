import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "@/lib/theme";

function Shimmer({ width, height }: { width: DimensionValue; height: number }) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 900, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.System }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.block, { width, height }, animatedStyle]} />;
}

/** Placeholder for one favorites row while the list loads. */
export function SkeletonCard() {
  return (
    <View style={styles.row}>
      <Shimmer width="62%" height={22} />
      <Shimmer width="38%" height={13} />
      <Shimmer width="92%" height={13} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
  block: { backgroundColor: colors.surfacePressed, borderRadius: radius.sm },
});
