import Feather from "@expo/vector-icons/Feather";
import { Redirect } from "expo-router";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, { Keyframe, ReduceMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { Button } from "@/components/Button";
import { RiseWords } from "@/components/fx";
import { Marquee } from "@/components/roller/Marquee";
import { useAuth } from "@/lib/auth";
import { EASE, enterFade, enterRise } from "@/lib/motion";
import { colors, fonts, typography } from "@/lib/theme";

const system = ReduceMotion.System;

/** The front door, set like the web's hero: the question as a poster, one lime button. */
export default function SignIn() {
  const { token, loading, signingIn, error, signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (!loading && token) {
    return <Redirect href="/(tabs)" />;
  }

  const glow = width * 1.3;

  return (
    <View style={styles.container}>
      <Marquee />
      <View pointerEvents="none" style={[styles.glow, { width: glow, height: glow, left: (width - glow) / 2 }]}>
        <Svg width={glow} height={glow}>
          <Defs>
            <RadialGradient id="signGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.12} />
              <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width={glow} height={glow} fill="url(#signGlow)" />
        </Svg>
      </View>

      <View style={[styles.hero, { paddingTop: insets.top + 40 }]}>
        <Animated.Text entering={enterRise(0, 100)} style={styles.kicker}>
          Stuck on what to build?
        </Animated.Text>
        <View style={styles.headline} accessible accessibilityRole="header" accessibilityLabel="What to do?">
          <RiseWords words={["WHAT", "TO", "DO"]} delay={150} wordStyle={styles.word} style={styles.words} />
          <Animated.Text entering={questionPop} style={[styles.word, styles.question]}>?</Animated.Text>
        </View>
        <Animated.Text entering={enterRise(0, 700)} style={styles.subtitle}>
          Roll an app idea worth building. Save the good ones. Build them on the web.
        </Animated.Text>
      </View>

      <Animated.View entering={enterRise(0, 900)} style={[styles.footer, { paddingBottom: insets.bottom + 28 }]}>
        {error ? (
          <Animated.Text entering={enterFade} style={styles.error}>
            {error}
          </Animated.Text>
        ) : null}
        <Button
          onPress={signIn}
          loading={signingIn}
          haptic="medium"
          icon={<Feather name="github" size={18} color={colors.accentInk} />}
        >
          Continue with GitHub
        </Button>
        <Text style={styles.hint}>Signing in keeps your saved ideas in sync with the web app.</Text>
      </Animated.View>
    </View>
  );
}

const questionPop = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0 }, { rotate: "-40deg" }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: "0deg" }], easing: EASE },
})
  .duration(700)
  .delay(600)
  .reduceMotion(system);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "space-between" },
  glow: { position: "absolute", top: "18%" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  kicker: { ...typography.label, color: colors.muted, letterSpacing: 3.3 },
  headline: { flexDirection: "row", alignItems: "flex-end", marginTop: 14 },
  words: { columnGap: 12 },
  word: { fontFamily: fonts.display, fontSize: 84, lineHeight: 80, color: colors.foreground },
  question: { color: colors.accent, marginLeft: 2 },
  subtitle: { ...typography.body, color: colors.muted, textAlign: "center", marginTop: 22, maxWidth: 300 },
  footer: { paddingHorizontal: 20, gap: 12 },
  hint: { ...typography.caption, color: colors.muted, textAlign: "center" },
  error: { ...typography.caption, color: colors.danger, textAlign: "center" },
});
