import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors, spacing, typography } from "@/lib/theme";

export function EmptyState({ message }: { message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.empty}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.lg,
  },
  text: {
    ...typography.body,
    color: colors.foregroundMuted,
    textAlign: "center",
  },
});
