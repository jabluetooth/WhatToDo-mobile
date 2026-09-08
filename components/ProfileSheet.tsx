import Feather from "@expo/vector-icons/Feather";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { getInitials } from "@/lib/avatarInitials";
import { useAuth } from "@/lib/auth";
import { useDailyReminder } from "@/lib/useDailyReminder";
import { colors, radius, spacing, typography } from "@/lib/theme";

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileSheet({ visible, onClose }: ProfileSheetProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const reminder = useDailyReminder();

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dragHandle} />

        <View style={styles.identity}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{getInitials(user?.name)}</Text>
            </View>
          )}
          {user?.name ? <Text style={styles.name}>{user.name}</Text> : null}
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        <Pressable onPress={reminder.toggle} style={styles.row}>
          <View style={styles.rowLeft}>
            <Feather
              name={reminder.enabled ? "bell" : "bell-off"}
              size={20}
              color={reminder.enabled ? colors.foreground : colors.foregroundMuted}
            />
            <Text style={styles.rowLabel}>Daily reminder</Text>
          </View>
          <Text style={styles.rowValue}>{reminder.enabled ? "On" : "Off"}</Text>
        </Pressable>
        {reminder.error ? <Text style={styles.error}>{reminder.error}</Text> : null}

        <Button
          variant="secondary"
          icon={<Feather name="log-out" size={16} color={colors.foreground} />}
          onPress={() => {
            onClose();
            signOut();
          }}
        >
          Sign out
        </Button>
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
    gap: spacing.lg,
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
  },
  identity: {
    alignItems: "center",
    gap: spacing.xs,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: spacing.xs,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  avatarInitials: {
    ...typography.heading,
    color: colors.foregroundMuted,
  },
  name: {
    ...typography.heading,
    color: colors.foreground,
  },
  email: {
    ...typography.caption,
    color: colors.foregroundMuted,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowLabel: {
    ...typography.body,
    color: colors.foreground,
  },
  rowValue: {
    ...typography.caption,
    color: colors.foregroundMuted,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
    marginTop: -spacing.md,
  },
});
