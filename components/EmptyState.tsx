import { StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { enterRise } from "@/lib/motion";
import { colors, spacing, typography } from "@/lib/theme";

export function EmptyState({ title, message }: { title?: string; message: string }) {
  return (
    <Animated.View entering={enterRise(0)} style={styles.empty}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  empty: { marginTop: spacing.xxl, paddingHorizontal: spacing.md, alignItems: "center", gap: spacing.sm },
  title: { ...typography.title, color: colors.foreground, textAlign: "center" },
  text: { ...typography.body, color: colors.muted, textAlign: "center", maxWidth: 300 },
});
