import { useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Redirect, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Kicker, RiseWords } from "@/components/fx";
import { TagChip } from "@/components/TagChip";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable, enterRise } from "@/lib/motion";
import { useSpec } from "@/lib/stores/spec";
import { colors, fonts, typography } from "@/lib/theme";
import type { PlatformTag, ScopeSize } from "@/lib/types";

const MIN_LENGTH = 12;
const MAX_LENGTH = 2000;

const PLATFORMS: { label: string; value: PlatformTag | undefined }[] = [
  { label: "Any", value: undefined },
  { label: "Web", value: "web" },
  { label: "Mobile", value: "mobile" },
];
const SCOPES: { label: string; value: ScopeSize | undefined }[] = [
  { label: "Not sure", value: undefined },
  { label: "Weekend", value: "weekend" },
  { label: "MVP", value: "mvp" },
  { label: "Production", value: "production" },
];

/**
 * Write your own idea (web: "Write my own"). Describe it in a sentence or two, optionally steer it
 * (platform, scope, stacks you know), and the spec gets written on the next screen.
 */
export default function Compose() {
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const start = useSpec((s) => s.start);
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<PlatformTag | undefined>();
  const [scope, setScope] = useState<ScopeSize | undefined>();
  const [stack, setStack] = useState("");

  if (!token) return <Redirect href="/sign-in" />;

  const ready = prompt.trim().length >= MIN_LENGTH;

  const submit = () => {
    if (!ready) return;
    const hints = {
      platform,
      scopeSize: scope,
      stackFamiliarity: stack.trim() || undefined,
    };
    void start(token, prompt.trim(), hints);
    router.replace("/spec");
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <Kicker>Write your own</Kicker>
        <AnimatedPressable scale="strong" haptic="light" onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={22} color={colors.foreground} />
        </AnimatedPressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <RiseWords words={["WHAT", "DO", "YOU", "WANT", "TO", "BUILD?"]} step={60} wordStyle={styles.title} style={styles.titleWords} />

        <Animated.View entering={enterRise(0, 350)}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="A habit tracker for night-shift nurses that nudges them to drink water between rounds…"
            placeholderTextColor={colors.foregroundSubtle}
            multiline
            maxLength={MAX_LENGTH}
            autoFocus
            style={styles.input}
            accessibilityLabel="Describe your app idea"
          />
          <Text style={styles.counter}>
            {prompt.trim().length < MIN_LENGTH ? "A sentence or two is plenty" : `${prompt.length} / ${MAX_LENGTH}`}
          </Text>
        </Animated.View>

        <Animated.View entering={enterRise(1, 350)} style={styles.group}>
          <Text style={styles.label}>Platform</Text>
          <View style={styles.chips}>
            {PLATFORMS.map((p) => (
              <TagChip key={p.label} label={p.label} selected={platform === p.value} onPress={() => setPlatform(p.value)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={enterRise(2, 350)} style={styles.group}>
          <Text style={styles.label}>Scope</Text>
          <View style={styles.chips}>
            {SCOPES.map((s) => (
              <TagChip key={s.label} label={s.label} selected={scope === s.value} onPress={() => setScope(s.value)} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={enterRise(3, 350)} style={styles.group}>
          <Text style={styles.label}>Stacks you know</Text>
          <TextInput
            value={stack}
            onChangeText={setStack}
            placeholder="e.g. React, Supabase"
            placeholderTextColor={colors.foregroundSubtle}
            maxLength={300}
            style={styles.stackInput}
            accessibilityLabel="Stacks you already know, optional"
          />
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Button
          onPress={submit}
          disabled={!ready}
          haptic="medium"
          trailing={<Feather name="arrow-right" size={18} color={colors.accentInk} />}
        >
          Write the spec
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -10 },
  body: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 24, gap: 22 },
  titleWords: { justifyContent: "flex-start", columnGap: 10 },
  title: { fontFamily: fonts.display, fontSize: 52, lineHeight: 65, color: colors.foreground },
  input: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 20,
    padding: 16,
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: 19,
    lineHeight: 27,
    textAlignVertical: "top",
  },
  counter: { ...typography.caption, color: colors.muted, marginTop: 8, textAlign: "right" },
  group: { gap: 10 },
  label: { ...typography.label, color: colors.muted },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stackInput: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 999,
    paddingHorizontal: 18,
    color: colors.foreground,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  footer: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, backgroundColor: colors.background },
});
