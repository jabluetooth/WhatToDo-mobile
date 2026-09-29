import { useEffect, useMemo, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import * as WebBrowser from "expo-web-browser";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { Kicker } from "@/components/fx";
import { RichText } from "@/components/RichText";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import { AnimatedPressable, TIMING, enterFade, enterRise, fireHaptic, layoutSoft } from "@/lib/motion";
import { projectTitle, useProjects } from "@/lib/stores/projects";
import { colors, fonts, typography } from "@/lib/theme";
import type { StackCategory } from "@/lib/types";

const STACK_ORDER: { key: StackCategory; label: string }[] = [
  { key: "frontend", label: "Frontend" },
  { key: "backend", label: "Backend" },
  { key: "database", label: "Database" },
  { key: "hosting", label: "Hosting" },
  { key: "auth", label: "Auth" },
];

/**
 * One project, built on the phone: generate its code (no live preview — that's the web's), read
 * the files, and push to a new GitHub repo when you're ready. Until then it just stays here, in
 * Saved → Projects, and on the web's History.
 */
export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const detail = useProjects((s) => (id ? s.details[id] : undefined));
  const build = useProjects((s) => (id ? s.builds[id] : undefined));
  const { load, build: startBuild, push, remove } = useProjects();

  const [refreshing, setRefreshing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSpec, setShowSpec] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (token && id) void load(token, id);
  }, [token, id, load]);

  const building = build && (build.state === "pending" || build.state === "running");
  const failed = build?.state === "failed";
  const code = detail?.code ?? null;
  const tree = useMemo(() => groupFiles(code?.files ?? []), [code?.files]);

  if (!token) return <Redirect href="/sign-in" />;
  if (!id) return <Redirect href="/(tabs)/favorites" />;

  const generate = async () => {
    setError(null);
    setStarting(true);
    try {
      await startBuild(token, id);
      fireHaptic("medium");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start the build. Try again.");
    } finally {
      setStarting(false);
    }
  };

  const doPush = async () => {
    setError(null);
    setPushing(true);
    try {
      await push(token, id, !isPublic);
      fireHaptic("success");
    } catch (err) {
      fireHaptic("warning");
      setError(err instanceof Error ? err.message : "Couldn't push to GitHub.");
    } finally {
      setPushing(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      fireHaptic("warning");
      return;
    }
    try {
      await remove(token, id);
      router.back();
    } catch {
      setError("Couldn't delete this project.");
    }
  };

  const title = detail ? projectTitle(detail.prompt) : "Project";

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable scale="strong" haptic="light" onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </AnimatedPressable>
        <Kicker>Project</Kicker>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load(token, id);
              setRefreshing(false);
            }}
            tintColor={colors.accent}
          />
        }
      >
        <Animated.View entering={enterRise(0)}>
          {detail?.hints?.platform ? <Text style={styles.mono}>{detail.hints.platform}</Text> : null}
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          {detail ? <Text style={styles.prompt} numberOfLines={4}>{detail.prompt}</Text> : null}
        </Animated.View>

        {error ? <Animated.Text entering={enterFade} style={styles.error}>{error}</Animated.Text> : null}

        {/* ── Code ── */}
        <Animated.View layout={layoutSoft} style={styles.block}>
          <Text style={styles.blockHead}>
            <Text style={styles.num}>01</Text>  Code
          </Text>

          {building ? (
            <BuildProgress progress={build.progress} message={build.message} />
          ) : failed ? (
            <Animated.View entering={enterFade} style={styles.gap}>
              <Text style={styles.muted}>The build didn't pass its check. {build.error ? "" : "Try again."}</Text>
              {build.error ? <Text style={styles.log} numberOfLines={6}>{build.error}</Text> : null}
              <Button variant="secondary" onPress={generate} loading={starting}>
                Try again
              </Button>
            </Animated.View>
          ) : code ? (
            <Animated.View entering={enterFade} style={styles.gap}>
              <Text style={styles.muted}>
                {code.files.length} files · generated {new Date(code.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Text>
              <View>
                {tree.map(({ dir, files }) => (
                  <View key={dir || "."}>
                    {dir ? <Text style={styles.dir}>{dir}/</Text> : null}
                    {files.map((f) => (
                      <AnimatedPressable
                        key={f.path}
                        scale="subtle"
                        haptic="selection"
                        onPress={() => router.push({ pathname: "/project/[id]/file", params: { id, path: f.path } })}
                        style={[styles.fileRow, dir ? styles.fileIndent : null]}
                        accessibilityRole="button"
                        accessibilityLabel={`Open ${f.path}`}
                      >
                        <Feather name="file-text" size={14} color={colors.muted} />
                        <Text style={styles.fileName} numberOfLines={1}>{f.path.slice(dir ? dir.length + 1 : 0)}</Text>
                        <Text style={styles.fileSize}>{fmtSize(f.size)}</Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                ))}
              </View>
              <AnimatedPressable onPress={generate} style={styles.textBtn} accessibilityRole="button">
                <Feather name="refresh-cw" size={13} color={colors.muted} />
                <Text style={styles.textBtnTxt}>Generate again</Text>
              </AnimatedPressable>
            </Animated.View>
          ) : (
            <View style={styles.gap}>
              <Text style={styles.muted}>
                Turn the spec into a working starter project: real files, checked before they reach you. The live preview is on the web.
              </Text>
              <Button onPress={generate} loading={starting} haptic="medium" trailing={<Feather name="zap" size={17} color={colors.accentInk} />}>
                Generate code
              </Button>
            </View>
          )}
        </Animated.View>

        {/* ── Publish ── */}
        {code && !building ? (
          <Animated.View entering={enterRise(0)} layout={layoutSoft} style={styles.block}>
            <Text style={styles.blockHead}>
              <Text style={styles.num}>02</Text>  Publish
            </Text>
            {code.repoUrl ? (
              <AnimatedPressable
                onPress={() => WebBrowser.openBrowserAsync(code.repoUrl!)}
                scale="subtle"
                style={styles.repo}
                accessibilityRole="link"
                accessibilityLabel={`Open the repo on GitHub, ${code.repoUrl}`}
              >
                <Feather name="github" size={18} color={colors.accentInk} />
                <Text style={styles.repoTxt} numberOfLines={1}>{code.repoUrl.replace("https://github.com/", "")}</Text>
                <Feather name="arrow-up-right" size={18} color={colors.accentInk} />
              </AnimatedPressable>
            ) : (
              <View style={styles.gap}>
                <Text style={styles.muted}>Push it to a new GitHub repo, or keep it here and push later.</Text>
                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>{isPublic ? "Public repo" : "Private repo"}</Text>
                    <Text style={styles.switchHint}>{isPublic ? "Anyone can see it" : "Only you can see it"}</Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: "rgba(243,241,234,0.16)", true: colors.accent }}
                    thumbColor={isPublic ? colors.accentInk : colors.foreground}
                    ios_backgroundColor="rgba(243,241,234,0.16)"
                    accessibilityLabel="Make the repo public"
                  />
                </View>
                {code.pushError && !code.repoUrl ? <Text style={styles.error}>Last push failed. Try again.</Text> : null}
                <Button onPress={doPush} loading={pushing} haptic="medium" icon={<Feather name="github" size={17} color={colors.accentInk} />}>
                  Push to GitHub
                </Button>
                <Text style={styles.fine}>The first push asks GitHub once for permission to create repos.</Text>
              </View>
            )}
          </Animated.View>
        ) : null}

        {/* ── Spec ── */}
        {detail ? (
          <View style={styles.block}>
            <AnimatedPressable onPress={() => setShowSpec((v) => !v)} style={styles.specHead} accessibilityRole="button" accessibilityState={{ expanded: showSpec }}>
              <Text style={styles.blockHead}>
                <Text style={styles.num}>{code && !building ? "03" : "02"}</Text>  Spec & stack
              </Text>
              <Feather name={showSpec ? "chevron-up" : "chevron-down"} size={20} color={colors.muted} />
            </AnimatedPressable>
            {showSpec && (
              <Animated.View entering={enterFade} style={styles.gap}>
                {detail.sections.map((s) => (
                  <View key={s.key} style={styles.gap}>
                    <Text style={styles.mono}>{s.title}</Text>
                    <RichText text={s.content} />
                  </View>
                ))}
                {detail.stack
                  ? STACK_ORDER.map(({ key, label }) => (
                      <View key={key} style={styles.stackRow}>
                        <Text style={styles.mono}>{label}</Text>
                        <Text style={styles.stackChoice}>{detail.stack![key].choice}</Text>
                        <Text style={styles.muted}>{detail.stack![key].rationale}</Text>
                      </View>
                    ))
                  : null}
              </Animated.View>
            )}
          </View>
        ) : null}

        <View style={styles.footerLinks}>
          <AnimatedPressable onPress={() => WebBrowser.openBrowserAsync(`${API_BASE_URL}/history`)} style={styles.textBtn} accessibilityRole="link">
            <Feather name="monitor" size={13} color={colors.muted} />
            <Text style={styles.textBtnTxt}>Live preview on the web</Text>
          </AnimatedPressable>
          <AnimatedPressable onPress={doDelete} style={styles.textBtn} accessibilityRole="button">
            <Feather name="trash-2" size={13} color={colors.danger} />
            <Text style={[styles.textBtnTxt, { color: colors.danger }]}>{confirmDelete ? "Tap again to delete" : "Delete project"}</Text>
          </AnimatedPressable>
        </View>
      </ScrollView>
    </View>
  );
}

function BuildProgress({ progress, message }: { progress: number; message: string }) {
  const w = useSharedValue(progress / 100);
  useEffect(() => {
    w.value = withTiming(Math.max(0.04, progress / 100), TIMING.standard);
  }, [progress, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <Animated.View entering={enterFade} style={styles.gap} accessibilityLabel={`Building, ${progress} percent. ${message}`}>
      <View style={styles.progressHead}>
        <Text style={styles.mono}>{message || "Building"}</Text>
        <Text style={styles.pct}>{Math.round(progress)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fill]} />
      </View>
      <Text style={styles.fine}>Usually about a minute. You can leave this screen; it keeps building.</Text>
    </Animated.View>
  );
}

function groupFiles(files: { path: string; size: number }[]) {
  const groups = new Map<string, { path: string; size: number }[]>();
  for (const f of files) {
    const dir = f.path.includes("/") ? f.path.slice(0, f.path.lastIndexOf("/")) : "";
    groups.set(dir, [...(groups.get(dir) ?? []), f]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)))
    .map(([dir, fs]) => ({ dir, files: fs }));
}

function fmtSize(bytes: number): string {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingTop: 12, gap: 28 },
  mono: { ...typography.label, color: colors.muted },
  title: { fontFamily: fonts.display, fontSize: 44, lineHeight: 55, color: colors.foreground, marginTop: 4 },
  prompt: { ...typography.body, fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 6 },
  error: { ...typography.caption, color: colors.danger },
  block: { gap: 14, paddingTop: 20, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  blockHead: { fontFamily: fonts.display, fontSize: 26, lineHeight: 33, color: colors.foreground, textTransform: "uppercase" },
  num: { fontFamily: fonts.mono, fontSize: 13, color: colors.accent },
  gap: { gap: 12 },
  muted: { ...typography.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  fine: { ...typography.caption, color: colors.foregroundSubtle },
  log: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 16, color: colors.muted, padding: 12, borderRadius: 12, backgroundColor: colors.surface },

  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  pct: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.accent },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.line, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4, backgroundColor: colors.accent },

  dir: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, paddingTop: 10, paddingBottom: 4 },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  fileIndent: { paddingLeft: 14 },
  fileName: { flex: 1, fontFamily: fonts.mono, fontSize: 13, color: colors.foreground },
  fileSize: { fontFamily: fonts.mono, fontSize: 11, color: colors.foregroundSubtle },

  switchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  switchLabel: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.foreground },
  switchHint: { ...typography.caption, color: colors.muted, marginTop: 2 },
  repo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  repoTxt: { flex: 1, fontFamily: fonts.mono, fontSize: 13, color: colors.accentInk },

  specHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stackRow: { gap: 4, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  stackChoice: { fontFamily: fonts.sansSemibold, fontSize: 17, color: colors.foreground },

  footerLinks: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12, paddingTop: 8 },
  textBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  textBtnTxt: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted },
});
