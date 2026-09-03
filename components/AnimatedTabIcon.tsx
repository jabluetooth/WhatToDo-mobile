import { useEffect } from "react";
import Feather from "@expo/vector-icons/Feather";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

interface AnimatedTabIconProps {
  name: keyof typeof Feather.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}

export function AnimatedTabIcon({ name, color, size, focused }: AnimatedTabIconProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, { damping: 12, stiffness: 250 });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Feather name={name} size={size} color={color} />
    </Animated.View>
  );
}
