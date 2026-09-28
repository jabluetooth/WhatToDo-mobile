import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, Text, View } from "react-native";
import { Kicker } from "@/components/fx";
import { Sheet } from "@/components/Sheet";
import { AnimatedPressable } from "@/lib/motion";
import { colors, fonts, typography } from "@/lib/theme";
import type { PlatformTag } from "@/lib/types";

export type PlatformFilter = PlatformTag | "all";

export const FILTERS: { label: string; value: PlatformFilter; hint: string }[] = [
  { label: "All platforms", value: "all", hint: "Web and mobile ideas" },
  { label: "Web", value: "web", hint: "Sites and web apps" },
  { label: "Mobile", value: "mobile", hint: "Phone apps" },
];

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  filter: PlatformFilter;
  onChange: (filter: PlatformFilter) => void;
}

/** Which kind of idea the roller draws (web: the prompt's platform hint). */
export function FilterDrawer({ visible, onClose, filter, onChange }: FilterDrawerProps) {
  return (
    <Sheet visible={visible} onClose={onClose}>
      <Kicker>Platform</Kicker>
      <Text style={styles.title}>WHAT KIND OF IDEA?</Text>
      <View>
        {FILTERS.map((f, i) => {
          const active = filter === f.value;
          return (
            <AnimatedPressable
              key={f.value}
              scale="subtle"
              haptic="selection"
              onPress={() => {
                onChange(f.value);
                onClose();
              }}
              style={[styles.option, i > 0 && styles.divider]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={f.label}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, active && styles.labelActive]}>{f.label}</Text>
                <Text style={styles.hint}>{f.hint}</Text>
              </View>
              <View style={[styles.radio, active && styles.radioOn]}>
                {active ? <Feather name="check" size={14} color={colors.accentInk} /> : null}
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.title, color: colors.foreground, marginTop: -6 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  label: { fontFamily: fonts.sansMedium, fontSize: 17, color: colors.foreground },
  labelActive: { fontFamily: fonts.sansSemibold },
  hint: { ...typography.caption, color: colors.muted, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.lineStrong, alignItems: "center", justifyContent: "center" },
  radioOn: { backgroundColor: colors.accent, borderColor: colors.accent },
});
