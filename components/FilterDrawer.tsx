import Feather from "@expo/vector-icons/Feather";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { PlatformTag } from "@/lib/types";

export type PlatformFilter = PlatformTag | "all";

export const FILTERS: { label: string; value: PlatformFilter }[] = [
  { label: "All platforms", value: "all" },
  { label: "Web", value: "web" },
  { label: "Mobile", value: "mobile" },
];

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  filter: PlatformFilter;
  onChange: (filter: PlatformFilter) => void;
}

export function FilterDrawer({ visible, onClose, filter, onChange }: FilterDrawerProps) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.title}>Filter ideas by platform</Text>
        <View style={styles.options}>
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => {
                  onChange(f.value);
                  onClose();
                }}
                style={styles.option}
              >
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{f.label}</Text>
                {active ? <Feather name="check" size={18} color={colors.foreground} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  options: {
    gap: spacing.xs,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionLabel: {
    ...typography.body,
    color: colors.foregroundMuted,
  },
  optionLabelActive: {
    color: colors.foreground,
    fontFamily: "Inter_600SemiBold",
  },
});
