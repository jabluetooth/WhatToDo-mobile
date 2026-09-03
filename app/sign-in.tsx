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
        <Text style={styles.wordmark}>7</Text>
        <Text style={styles.title}>What To Do</Text>
        <Text style={styles.subtitle}>Browse app ideas and save the ones worth building.</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(500).delay(150)} style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button onPress={signIn} disabled={signingIn} loading={signingIn}>
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
    fontSize: 56,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    color: colors.foreground,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    maxWidth: 280,
  },
  footer: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
});
