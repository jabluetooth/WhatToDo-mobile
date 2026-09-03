import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing, typography } from "@/lib/theme";

interface TagChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

export function TagChip({ label, selected, onPress }: TagChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  chipSelected: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    ...typography.caption,
    color: colors.muted,
  },
  textSelected: {
    color: colors.background,
    fontWeight: "600",
  },
});
