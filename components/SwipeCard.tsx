import { Dimensions, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Button } from "@/components/Button";
import { IdeaCard } from "@/components/IdeaCard";
import { spacing } from "@/lib/theme";
import type { RandomIdea } from "@/lib/types";

const SWIPE_THRESHOLD = 120;
const SCREEN_WIDTH = Dimensions.get("window").width;
const FLY_OUT_DURATION = 220;

interface SwipeCardProps {
  idea: RandomIdea;
  /** Called after the fly-out animation finishes, not on release — lets the parent swap the queue without cutting the animation short. */
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

export function SwipeCard({ idea, onSwipeRight, onSwipeLeft }: SwipeCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  function flyOut(direction: 1 | -1, callback: () => void) {
    translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: FLY_OUT_DURATION });
    setTimeout(callback, FLY_OUT_DURATION);
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(flyOut)(1, onSwipeRight);
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        runOnJS(flyOut)(-1, onSwipeLeft);
      } else {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-12, 12], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }],
    };
  });

  return (
    <View>
      <GestureDetector gesture={pan}>
        <Animated.View style={cardStyle}>
          <IdeaCard idea={idea} variant="detail" />
        </Animated.View>
      </GestureDetector>
      <View style={styles.fallbackRow}>
        <Button variant="secondary" style={styles.flexButton} onPress={() => flyOut(-1, onSwipeLeft)}>
          ✕ Skip
        </Button>
        <Button style={styles.flexButton} onPress={() => flyOut(1, onSwipeRight)}>
          ★ Favorite
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
});
