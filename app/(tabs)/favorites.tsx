import { useMemo, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { FavoriteEditSheet } from "@/components/FavoriteEditSheet";
import { DiceIcon, Kicker, RiseWords, Watermark } from "@/components/fx";
import { SkeletonCard } from "@/components/Skeleton";
import { TagChip } from "@/components/TagChip";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable, enterFade, enterRise, layoutSoft } from "@/lib/motion";
import { useFavorites } from "@/lib/stores/favorites";
import { projectTitle, useProjects, type Build } from "@/lib/stores/projects";
import { colors, fonts, typography } from "@/lib/theme";
import { PRESET_TAGS, type Favorite, type PresetTag, type ProjectSummary } from "@/lib/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

type View_ = "ideas" | "projects";

/**
 * Everything you kept, in two views (web: the History page): Ideas you saved from a roll, and
 * Projects — specs you kept, code you generated, repos you pushed. Tap a project to build it,
 * read its files or push it to GitHub.
 */
export default function SavedScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const fav = useFavorites();
  const proj = useProjects();
  const [view, setView] = useState<View_>("ideas");
  const [tagFilter, setTagFilter] = useState<PresetTag | null>(null);
  const [editing, setEditing] = useState<Favorite | null>(null);

  const ideas = useMemo(
    () => (tagFilter ? fav.items.filter((f) => f.tags?.includes(tagFilter)) : fav.items),
    [fav.items, tagFilter],
  );

  const isIdeas = view === "ideas";
  const ready = isIdeas ? fav.ready : proj.ready;
  const syncing = isIdeas ? fav.syncing : proj.syncing;
  const error = isIdeas ? fav.error : proj.error;
  const refresh = () => {
    if (!token) return;
    void (isIdeas ? fav.sync(token) : proj.sync(token));
  };

  const header = (
    <View style={styles.header}>
      <Kicker>Your shortlist</Kicker>
      <RiseWords words={["SAVED"]} wordStyle={styles.title} style={styles.titleWords} />

      <View style={styles.views} accessibilityRole="tablist">
        {(["ideas", "projects"] as const).map((v) => {
          const on = view === v;
          const n = v === "ideas" ? fav.items.length : proj.items.length;
          return (
            <AnimatedPressable
              key={v}
              onPress={() => setView(v)}
              scale="strong"
              haptic="selection"
              style={[styles.viewBtn, on && styles.viewBtnOn]}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.viewTxt, on && styles.viewTxtOn]}>{v === "ideas" ? "Ideas" : "Projects"}</Text>
              {n > 0 ? <Text style={[styles.viewCount, on && styles.viewTxtOn]}>{n}</Text> : null}
            </AnimatedPressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isIdeas && fav.items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>
          <TagChip label="All" selected={!tagFilter} onPress={() => setTagFilter(null)} />
          {PRESET_TAGS.map((tag) => (
            <TagChip key={tag} label={tag} selected={tagFilter === tag} onPress={() => setTagFilter(tagFilter === tag ? null : tag)} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const loading = (
    <View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader />
      {isIdeas ? (
        <FlatList
          key="ideas"
          data={fav.ready ? ideas : []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
          refreshControl={<RefreshControl refreshing={syncing && ready} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            !fav.ready ? loading : tagFilter ? (
              <Text style={styles.emptyTag}>Nothing tagged “{tagFilter}” yet.</Text>
            ) : (
              <Animated.View entering={enterRise(0, 100)} style={styles.empty}>
                <Text style={styles.emptyTitle}>NOTHING SAVED YET</Text>
                <Text style={styles.emptyText}>Roll an idea and tap Save, or swipe it right. It lands here.</Text>
                <Button onPress={() => router.navigate("/(tabs)")} icon={<DiceIcon size={18} color={colors.accentInk} />} style={styles.emptyBtn}>
                  Roll an idea
                </Button>
              </Animated.View>
            )
          }
          renderItem={({ item, index }) => <IdeaRow fav={item} index={index} onPress={() => setEditing(item)} />}
        />
      ) : (
        <FlatList
          key="projects"
          data={proj.ready ? proj.items : []}
          keyExtractor={(item) => item.projectId}
          contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
          refreshControl={<RefreshControl refreshing={syncing && ready} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accent]} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            !proj.ready ? loading : (
              <Animated.View entering={enterRise(0, 100)} style={styles.empty}>
                <Text style={styles.emptyTitle}>NO PROJECTS YET</Text>
                <Text style={styles.emptyText}>Tap Build this on an idea, then Keep or Generate code. Your specs and code land here.</Text>
                <Button onPress={() => router.navigate("/(tabs)")} icon={<DiceIcon size={18} color={colors.accentInk} />} style={styles.emptyBtn}>
                  Roll an idea
                </Button>
              </Animated.View>
            )
          }
          renderItem={({ item, index }) => (
            <ProjectRow
              project={item}
              build={proj.builds[item.projectId]}
              index={index}
              onPress={() => router.push({ pathname: "/project/[id]", params: { id: item.projectId } })}
            />
          )}
        />
      )}
      <Watermark />
      <FavoriteEditSheet favorite={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

function IdeaRow({ fav, index, onPress }: { fav: Favorite; index: number; onPress: () => void }) {
  const pending = fav.id.startsWith("local-");
  return (
    <Animated.View entering={enterRise(Math.min(index, 8))} layout={layoutSoft}>
      <AnimatedPressable
        onPress={onPress}
        disabled={pending}
        scale="subtle"
        haptic="selection"
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`${fav.title}, ${fav.targetUser}. Open`}
      >
        <View style={styles.rowMeta}>
          <Text style={styles.mono}>{fav.platformTag}</Text>
          <Text style={styles.mono}>{pending ? "Saving…" : fmtDate(fav.createdAt)}</Text>
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>{fav.title.toUpperCase()}</Text>
        <Text style={styles.rowTarget} numberOfLines={1}>{fav.targetUser}</Text>
        <Text style={styles.rowDesc} numberOfLines={2}>{fav.description}</Text>
        {fav.tags?.length || fav.notes ? (
          <View style={styles.rowTags}>
            {fav.tags?.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagTxt}>{t}</Text>
              </View>
            ))}
            {fav.notes ? <Text style={styles.noteMark} numberOfLines={1}>· {fav.notes}</Text> : null}
          </View>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

/** Where a project stands, in one word: the loudest state wins. */
function projectStatus(p: ProjectSummary, build?: Build): { label: string; icon: keyof typeof Feather.glyphMap; lime: boolean } {
  if (build && (build.state === "pending" || build.state === "running")) {
    return { label: `Building ${Math.round(build.progress)}%`, icon: "loader", lime: true };
  }
  if (build?.state === "failed") return { label: "Build failed", icon: "alert-circle", lime: false };
  if (p.code?.repoUrl) return { label: "Pushed", icon: "github", lime: true };
  if (p.code) return { label: "Code ready", icon: "check-circle", lime: true };
  return { label: p.hasStack ? "Spec + stack" : "Spec", icon: "file-text", lime: false };
}

function ProjectRow({ project, build, index, onPress }: { project: ProjectSummary; build?: Build; index: number; onPress: () => void }) {
  const status = projectStatus(project, build);
  const title = projectTitle(project.prompt);
  return (
    <Animated.View entering={enterRise(Math.min(index, 8))} layout={layoutSoft}>
      <AnimatedPressable
        onPress={onPress}
        scale="subtle"
        haptic="selection"
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${status.label}. Open`}
      >
        <View style={styles.rowMeta}>
          <Text style={styles.mono}>{project.platform ?? "project"}</Text>
          <Text style={styles.mono}>{fmtDate(project.updatedAt)}</Text>
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>{title.toUpperCase()}</Text>
        <Animated.View key={status.label} entering={enterFade} style={[styles.status, status.lime && styles.statusLime]}>
          <Feather name={status.icon} size={12} color={status.lime ? colors.accentInk : colors.muted} />
          <Text style={[styles.statusTxt, status.lime && { color: colors.accentInk }]}>{status.label}</Text>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 20, flexGrow: 1 },

  header: { paddingBottom: 12, gap: 6 },
  titleWords: { justifyContent: "flex-start", marginTop: 6 },
  title: { fontFamily: fonts.display, fontSize: 64, lineHeight: 80, color: colors.foreground },
  error: { ...typography.caption, color: colors.danger, marginTop: 6 },

  views: { flexDirection: "row", gap: 8, marginTop: 8 },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  viewBtnOn: { backgroundColor: colors.foreground, borderColor: colors.foreground },
  viewTxt: { fontFamily: fonts.sansSemibold, fontSize: 14, color: colors.muted },
  viewTxtOn: { color: colors.background },
  viewCount: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },

  filterScroll: { marginHorizontal: -20, marginTop: 14 },
  filters: { gap: 8, paddingHorizontal: 20 },

  row: { paddingVertical: 20, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowMeta: { flexDirection: "row", justifyContent: "space-between" },
  mono: { ...typography.label, fontSize: 10, color: colors.muted },
  rowTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 38, color: colors.foreground, marginTop: 2 },
  rowTarget: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.foreground },
  rowDesc: { ...typography.body, fontSize: 15, lineHeight: 21, color: colors.muted },
  rowTags: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 },
  tag: { borderWidth: 1, borderColor: colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagTxt: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.accent },
  noteMark: { flexShrink: 1, ...typography.caption, color: colors.muted, fontStyle: "italic" },

  status: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusLime: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusTxt: { ...typography.label, fontSize: 10, color: colors.muted },

  empty: { alignItems: "center", gap: 12, marginTop: 40, paddingHorizontal: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 44, lineHeight: 55, color: colors.foreground, textAlign: "center" },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center", maxWidth: 290 },
  emptyBtn: { marginTop: 10, alignSelf: "stretch" },
  emptyTag: { ...typography.body, color: colors.muted, marginTop: 24 },
});
