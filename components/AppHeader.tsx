import { type ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getInitials } from "@/lib/avatarInitials";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable } from "@/lib/motion";
import { useUi } from "@/lib/stores/ui";
import { colors, fonts } from "@/lib/theme";

/**
 * The same header on every tab (web: SiteNav): the wordmark on the left, anything the screen
 * needs (e.g. the Ideas filter) and your avatar on the right. The avatar opens your profile.
 */
export function AppHeader({ right }: { right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const openProfile = useUi((s) => s.openProfile);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.wordmark} accessibilityRole="header" accessibilityLabel="What to do?">
        WHAT TO DO<Text style={styles.q}>?</Text>
      </Text>
      <View style={styles.right}>
        {right}
        <AnimatedPressable
          onPress={openProfile}
          scale="strong"
          haptic="selection"
          hitSlop={8}
          style={styles.avatarBtn}
          accessibilityRole="button"
          accessibilityLabel="Your profile and settings"
        >
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.initials}>{getInitials(user?.name)}</Text>
            </View>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 5,
  },
  wordmark: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30, color: colors.foreground, letterSpacing: 0.3 },
  q: { color: colors.accent },
  right: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: colors.lineStrong },
  avatarFallback: { backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: fonts.sansSemibold, fontSize: 12, color: colors.foreground },
});
