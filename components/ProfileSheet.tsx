import Feather from "@expo/vector-icons/Feather";
import * as WebBrowser from "expo-web-browser";
import { Image, StyleSheet, Switch, Text, View } from "react-native";
import { Kicker } from "@/components/fx";
import { Sheet } from "@/components/Sheet";
import { getInitials } from "@/lib/avatarInitials";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable } from "@/lib/motion";
import { useFavorites } from "@/lib/stores/favorites";
import { useDailyReminder } from "@/lib/useDailyReminder";
import { colors, fonts, typography } from "@/lib/theme";

const WEB_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://whattodoby.filheinzrelatorre.com";

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

/** You: who's signed in, how many ideas you've kept, the daily nudge, and the way out. */
export function ProfileSheet({ visible, onClose }: ProfileSheetProps) {
  const { user, signOut } = useAuth();
  const saved = useFavorites((s) => s.items.length);
  const reminder = useDailyReminder();

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={styles.identity}>
        {user?.image ? (
          <Image source={{ uri: user.image }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.initials}>{getInitials(user?.name)}</Text>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{user?.name ?? "Signed in"}</Text>
          {user?.email ? <Text style={styles.email} numberOfLines={1}>{user.email}</Text> : null}
        </View>
        <View style={styles.count}>
          <Text style={styles.countVal}>{saved}</Text>
          <Text style={styles.countLbl}>SAVED</Text>
        </View>
      </View>

      <Kicker>Settings</Kicker>
      <View>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Daily idea</Text>
            <Text style={styles.rowHint}>A nudge at 9:00 with something to build</Text>
          </View>
          <Switch
            value={reminder.enabled}
            onValueChange={reminder.toggle}
            trackColor={{ false: "rgba(243,241,234,0.16)", true: colors.accent }}
            thumbColor={reminder.enabled ? colors.accentInk : colors.foreground}
            ios_backgroundColor="rgba(243,241,234,0.16)"
            accessibilityLabel="Daily idea reminder"
          />
        </View>
        {reminder.error ? <Text style={styles.error}>{reminder.error}</Text> : null}

        <AnimatedPressable scale="subtle" style={[styles.row, styles.divider]} onPress={() => WebBrowser.openBrowserAsync(WEB_URL)} accessibilityRole="link">
          <Text style={[styles.rowLabel, { flex: 1 }]}>Open What To Do on the web</Text>
          <Feather name="arrow-up-right" size={18} color={colors.muted} />
        </AnimatedPressable>

        <AnimatedPressable
          scale="subtle"
          haptic="light"
          style={[styles.row, styles.divider]}
          onPress={() => {
            onClose();
            signOut();
          }}
          accessibilityRole="button"
        >
          <Text style={[styles.rowLabel, { flex: 1, color: colors.danger }]}>Sign out</Text>
          <Feather name="log-out" size={17} color={colors.danger} />
        </AnimatedPressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  identity: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: fonts.display, fontSize: 24, color: colors.accentInk },
  name: { fontFamily: fonts.sansSemibold, fontSize: 18, color: colors.foreground },
  email: { ...typography.caption, color: colors.muted, marginTop: 2 },
  count: { alignItems: "flex-end" },
  countVal: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: colors.accent },
  countLbl: { ...typography.label, fontSize: 10, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 16, minHeight: 56 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowLabel: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.foreground },
  rowHint: { ...typography.caption, color: colors.muted, marginTop: 2 },
  error: { ...typography.caption, color: colors.danger, marginTop: -6, marginBottom: 8 },
});
