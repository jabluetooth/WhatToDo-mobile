import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SWIPE_THRESHOLD = 120;
const SCREEN_WIDTH = Dimensions.get("window").width;
const FLY_OUT_DURATION = 220;

interface UseSwipeGestureOptions {
  /** Called after the fly-out animation finishes, not on release — lets the caller swap content without cutting the animation short. */
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
}

export function useSwipeGesture({ onSwipeRight, onSwipeLeft }: UseSwipeGestureOptions) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  function flyOut(direction: 1 | -1, callback: () => void) {
    translateX.value = withTiming(direction * SCREEN_WIDTH * 1.5, { duration: FLY_OUT_DURATION });
    setTimeout(callback, FLY_OUT_DURATION);
  }

  const gesture = Gesture.Pan()
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

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH, SCREEN_WIDTH], [-12, 12], Extrapolation.CLAMP);
    return {
      transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }],
    };
  });

  return { gesture, animatedStyle, flyOut };
}
