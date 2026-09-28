import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { DECOY_TITLES } from "@/lib/decoys";
import { colors, fonts } from "@/lib/theme";

/**
 * Three rows of idea titles drifting in alternating directions behind the hero (web: Hero's
 * MarqueeBackdrop), barely visible. Each row holds its text twice and slides by one copy's width,
 * so the loop is seamless.
 */
export function Marquee() {
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((r) => {
        const titles = DECOY_TITLES.slice(r * 9).concat(DECOY_TITLES.slice(0, r * 9));
        return <Row key={r} text={titles.join("  ✦  ").toUpperCase() + "  ✦  "} reverse={r % 2 === 1} seconds={90 + r * 25} />;
      })}
    </View>
  );
}

function Row({ text, reverse, seconds }: { text: string; reverse: boolean; seconds: number }) {
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (!width) return;
    x.value = reverse ? -width : 0;
    x.value = withRepeat(
      withTiming(reverse ? 0 : -width, { duration: seconds * 1000, easing: Easing.linear, reduceMotion: ReduceMotion.System }),
      -1,
      false,
    );
    return () => cancelAnimation(x);
  }, [width, reverse, seconds, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.track, style]}>
        <Text style={styles.text} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>{text}</Text>
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", gap: 14, opacity: 0.07 },
  row: { overflow: "hidden", height: 74 },
  // Far wider than any screen so the line runs off the edge instead of wrapping.
  track: { flexDirection: "row", width: 20000 },
  text: { fontFamily: fonts.display, fontSize: 64, lineHeight: 74, color: colors.foreground, flexShrink: 0 },
});
