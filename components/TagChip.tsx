import { StyleSheet, Text } from "react-native";
import { AnimatedPressable } from "@/lib/motion";
import { colors, fonts, radius, spacing } from "@/lib/theme";

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Filter/tag pill: hairline outline, filled lime when chosen (web: rounded-full border-line). */
export function TagChip({ label, selected, onPress }: TagChipProps) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scale="strong"
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  text: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted },
  textSelected: { color: colors.accentInk, fontFamily: fonts.sansSemibold },
});
