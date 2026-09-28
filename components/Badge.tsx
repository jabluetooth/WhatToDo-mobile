import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, typography } from "@/lib/theme";

/** Outlined mono tag, e.g. the idea's platform (web: the roller's `border-current` pill). */
export function Badge({ label, color = colors.muted, style }: { label: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.badge, { borderColor: color }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  text: { ...typography.label },
});
