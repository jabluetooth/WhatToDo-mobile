import Feather from "@expo/vector-icons/Feather";
import { Redirect } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Button } from "@/components/Button";
import { useAuth } from "@/lib/auth";
import { colors, spacing, typography } from "@/lib/theme";

export default function SignIn() {
  const { token, loading, signingIn, error, signIn } = useAuth();

  if (!loading && token) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.hero}>
        {/* Decorative — the actual app name is the visible, accessible title right below it. */}
        <Text style={styles.wordmark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          7
        </Text>
        <Text style={styles.title}>What To Do</Text>
        <Text style={styles.subtitle}>Browse app ideas and save the ones worth building.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(150)} style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          onPress={signIn}
          disabled={signingIn}
          loading={signingIn}
          icon={<Feather name="github" size={16} color={colors.background} />}
        >
          Continue with GitHub
        </Button>
        <Text style={styles.hint}>Sign-in is required to save favorites across sessions.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl * 2,
  },
  hero: {
    alignItems: "center",
    marginTop: spacing.xl * 2,
    gap: spacing.sm,
  },
  wordmark: {
    fontFamily: "Inter_700Bold",
    fontSize: 56,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    lineHeight: 34,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.body,
    color: colors.foregroundMuted,
    textAlign: "center",
    maxWidth: 280,
  },
  footer: {
    gap: spacing.sm,
  },
  hint: {
    ...typography.caption,
    color: colors.foregroundMuted,
    textAlign: "center",
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: "center",
  },
});
