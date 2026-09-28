import { useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as WebBrowser from "expo-web-browser";
import { Redirect, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Kicker } from "@/components/fx";
import { RichText } from "@/components/RichText";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable, enterFade, enterRise, fireHaptic } from "@/lib/motion";
import { useFavorites } from "@/lib/stores/favorites";
import { useSpec } from "@/lib/stores/spec";
import { colors, fonts, typography } from "@/lib/theme";
import type { StackCategory } from "@/lib/types";
import { continueOnWebUrl, continuePromptOnWebUrl } from "@/lib/webLink";

const STACK_ORDER: { key: StackCategory; label: string }[] = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "database", label: "Database" },
  { key: "hosting", label: "Hosting" },
  { key: "auth", label: "Auth" },
];

/**
 * The spec for one idea, written on the phone (web: the PRD and Stack steps). The PRD's six
 * sections read top to bottom; the stack is one tap further; code is generated on the web.
 */
export default function SpecScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const spec = useSpec();
  const saveFav = useFavorites((s) => s.save);
  const saved = useFavorites((s) => (spec.idea ? s.isSaved(spec.idea) : false));

  if (!token) return <Redirect href="/sign-in" />;
  if (spec.status === "idle") return <Redirect href="/(tabs)" />;

  const title = spec.idea ? spec.idea.title : "Your idea";
  const webUrl = spec.idea ? continueOnWebUrl(spec.idea) : continuePromptOnWebUrl(spec.prompt, spec.hints);

  const save = async () => {
    if (!spec.idea || saved) return;
    const ok = await saveFav(token, spec.idea);
    fireHaptic(ok ? "success" : "warning");
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable scale="strong" haptic="light" onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </AnimatedPressable>
        <Kicker>{spec.status === "ready" ? "Spec" : "Writing the spec"}</Kicker>
        <View style={styles.back} />
      </View>

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 24 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={enterRise(0)}>
          {spec.idea ? <Text style={styles.mono}>{spec.idea.platformTag}</Text> : null}
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <Text style={styles.prompt} numberOfLines={spec.idea ? 3 : 5}>
            {spec.idea ? spec.idea.targetUser : `“${spec.prompt}”`}
          </Text>
        </Animated.View>

        {spec.status === "writing" && <Writing />}

        {spec.status === "clarify" && spec.question && <Clarify question={spec.question} error={spec.error} onAnswer={(a) => spec.answer(token, a)} />}

        {spec.status === "error" && (
          <Animated.View entering={enterFade} style={styles.errorBox}>
            <Text style={styles.noDice}>NO DICE.</Text>
            <Text style={styles.muted}>{spec.error}</Text>
            <Button variant="secondary" onPress={() => spec.retry(token)}>
              Try again
            </Button>
          </Animated.View>
        )}

        {spec.status === "ready" && (
          <>
            {spec.lowConfidence && (
              <Animated.View entering={enterFade} style={styles.note}>
                <Feather name="info" size={16} color={colors.accent} />
                <Text style={styles.noteTxt}>The idea was still a bit open, so some of this is a best guess. Edit freely on the web.</Text>
              </Animated.View>
            )}

            {spec.sections.map((sec, i) => (
              <Animated.View key={sec.key} entering={enterRise(i)} style={styles.section}>
                <Text style={styles.sectionHead}>
                  <Text style={styles.sectionNum}>{String(i + 1).padStart(2, "0")}</Text>  {sec.title}
                </Text>
                <RichText text={sec.content} />
              </Animated.View>
            ))}

            <View style={styles.section}>
              <Text style={styles.sectionHead}>
                <Text style={styles.sectionNum}>{String(spec.sections.length + 1).padStart(2, "0")}</Text>  Stack
              </Text>
              {spec.stack ? (
                STACK_ORDER.map(({ key, label }, i) => (
                  <Animated.View key={key} entering={enterRise(i)} style={[styles.stackRow, i > 0 && styles.divider]}>
                    <Text style={styles.mono}>{label}</Text>
                    <Text style={styles.stackChoice}>{spec.stack![key].choice}</Text>
                    <Text style={styles.muted}>{spec.stack![key].rationale}</Text>
                  </Animated.View>
                ))
              ) : (
                <>
                  <Text style={styles.muted}>Get a recommended frontend, backend, database, hosting and auth, with the reason for each.</Text>
                  {spec.stackError ? <Text style={styles.error}>{spec.stackError}</Text> : null}
                  <Button variant="secondary" onPress={() => spec.recommendStack(token)} loading={spec.stackLoading}>
                    Recommend a stack
                  </Button>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {spec.status === "ready" && (
        <Animated.View entering={enterFade} style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          {spec.idea && (
            <Button
              variant="secondary"
              onPress={save}
              disabled={saved}
              style={styles.saveBtn}
              icon={<Ionicons name={saved ? "checkmark" : "star-outline"} size={17} color={colors.foreground} />}
              accessibilityLabel={saved ? "Saved" : "Save idea"}
            >
              {saved ? "Saved" : "Save"}
            </Button>
          )}
          <Button
            onPress={() => WebBrowser.openBrowserAsync(webUrl)}
            style={styles.flex}
            trailing={<Feather name="arrow-up-right" size={18} color={colors.accentInk} />}
            accessibilityLabel="Build the code on the web"
          >
            Build it on web
          </Button>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

/** The web's "Writing the spec" state: a mono label over an indeterminate lime bar. */
function Writing() {
  const { width } = useWindowDimensions();
  const barW = width - 40;
  const x = useSharedValue(-0.3);
  useEffect(() => {
    x.value = withRepeat(withTiming(1.1, { duration: 1300, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }), -1, false);
    return () => cancelAnimation(x);
  }, [x]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * barW }] }));
  return (
    <Animated.View entering={enterFade} style={styles.writing} accessibilityLabel="Writing the spec">
      <Text style={styles.mono}>Problem · Users · Features · Stories · Scope · Estimate</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: barW * 0.35 }, style]} />
      </View>
      <Text style={styles.muted}>Usually 10 to 20 seconds.</Text>
    </Animated.View>
  );
}

function Clarify({ question, error, onAnswer }: { question: string; error: string | null; onAnswer: (a: string) => void }) {
  const [answer, setAnswer] = useState("");
  return (
    <Animated.View entering={enterRise(0)} style={styles.clarify}>
      <Kicker>One quick question</Kicker>
      <Text style={styles.question}>{question}</Text>
      <TextInput
        value={answer}
        onChangeText={setAnswer}
        placeholder="Your answer"
        placeholderTextColor={colors.foregroundSubtle}
        multiline
        maxLength={1000}
        autoFocus
        style={styles.answer}
        accessibilityLabel="Your answer"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button onPress={() => onAnswer(answer.trim())} disabled={answer.trim().length < 2} trailing={<Feather name="arrow-right" size={18} color={colors.accentInk} />}>
        Answer
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingTop: 12, gap: 28 },
  mono: { ...typography.label, color: colors.muted },
  title: { fontFamily: fonts.display, fontSize: 48, lineHeight: 60, color: colors.foreground, marginTop: 6 },
  prompt: { fontFamily: fonts.sansSemibold, fontSize: 17, lineHeight: 24, color: colors.foreground, marginTop: 10 },
  muted: { ...typography.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  error: { ...typography.caption, color: colors.danger },

  writing: { gap: 14, paddingTop: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 3, backgroundColor: colors.accent },

  clarify: { gap: 14 },
  question: { fontFamily: fonts.sansSemibold, fontSize: 20, lineHeight: 28, color: colors.foreground },
  answer: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 18,
    padding: 14,
    color: colors.foreground,
    ...typography.body,
    textAlignVertical: "top",
  },

  errorBox: { gap: 12, alignItems: "stretch" },
  noDice: { fontFamily: fonts.display, fontSize: 56, lineHeight: 70, color: colors.foreground },

  note: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, backgroundColor: colors.accentSoft },
  noteTxt: { flex: 1, ...typography.caption, color: colors.foreground, lineHeight: 19 },

  section: { gap: 12, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  sectionHead: { fontFamily: fonts.display, fontSize: 26, lineHeight: 32, color: colors.foreground, textTransform: "uppercase" },
  sectionNum: { fontFamily: fonts.mono, fontSize: 13, color: colors.accent },
  stackRow: { gap: 4, paddingVertical: 12 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  stackChoice: { fontFamily: fonts.sansSemibold, fontSize: 18, color: colors.foreground },

  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
    backgroundColor: colors.background,
  },
  saveBtn: { paddingHorizontal: 18 },
  flex: { flex: 1 },
});
