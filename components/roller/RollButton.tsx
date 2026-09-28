import { useEffect } from "react";
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
import Svg, { Defs, Path, Text as SvgText, TextPath } from "react-native-svg";
import { DiceIcon } from "@/components/fx";
import { AnimatedPressable } from "@/lib/motion";
import { colors, fonts } from "@/lib/theme";

const SIZE = 196;
const RING = "Roll an idea ✦ Roll an idea ✦ Roll an idea ✦ ";

/**
 * The one control on the Ideas screen that matters (web: Hero's RollButton): a lime disc with the
 * dice, inside a ring of text that orbits slowly. The dice turns once on every press.
 */
export function RollButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  const orbit = useSharedValue(0);
  const dice = useSharedValue(0);

  useEffect(() => {
    orbit.value = withRepeat(
      withTiming(360, { duration: 18000, easing: Easing.linear, reduceMotion: ReduceMotion.System }),
      -1,
      false,
    );
    return () => cancelAnimation(orbit);
  }, [orbit]);

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbit.value}deg` }] }));
  const diceStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${dice.value}deg` }] }));

  const press = () => {
    dice.value = withTiming(dice.value + 360, { duration: 700, easing: Easing.bezier(0.16, 1, 0.3, 1), reduceMotion: ReduceMotion.System });
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={press}
      disabled={disabled}
      scale="strong"
      haptic="medium"
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel="Roll a random app idea"
    >
      <Animated.View style={[StyleSheet.absoluteFill, ringStyle]} pointerEvents="none">
        <Svg width={SIZE} height={SIZE} viewBox="0 0 200 200">
          <Defs>
            <Path id="roll-ring" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
          </Defs>
          <SvgText fill={colors.foreground} fontSize={11} fontFamily={fonts.mono} letterSpacing={4.2}>
            <TextPath href="#roll-ring">{RING.toUpperCase()}</TextPath>
          </SvgText>
        </Svg>
      </Animated.View>
      <View style={styles.disc}>
        <Animated.View style={diceStyle}>
          <DiceIcon size={30} color={colors.accentInk} />
        </Animated.View>
        <Text style={styles.label}>ROLL</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
  disc: {
    width: SIZE * 0.68,
    height: SIZE * 0.68,
    borderRadius: SIZE,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.55,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  label: { fontFamily: fonts.display, fontSize: 30, lineHeight: 32, color: colors.accentInk, marginTop: 4 },
});
