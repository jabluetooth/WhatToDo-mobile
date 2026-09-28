import { useMemo, useState } from "react";
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
import { colors, fonts, typography } from "@/lib/theme";
import { PRESET_TAGS, type Favorite, type PresetTag } from "@/lib/types";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * Saved ideas as a plain list (web: the History page): hairline rows, poster titles, tags you can
 * filter by. Tap a row to tag it, add notes, share it or take it to the web to build.
 */
export default function FavoritesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { items, ready, syncing, error, sync } = useFavorites();
  const [tagFilter, setTagFilter] = useState<PresetTag | null>(null);
  const [editing, setEditing] = useState<Favorite | null>(null);

  const visible = useMemo(
    () => (tagFilter ? items.filter((f) => f.tags?.includes(tagFilter)) : items),
    [items, tagFilter],
  );

  const header = (
    <View style={styles.header}>
      <Kicker>Your shortlist</Kicker>
      <View style={styles.titleRow}>
        <RiseWords words={["SAVED"]} wordStyle={styles.title} style={styles.titleWords} />
        {items.length > 0 && (
          <Animated.Text entering={enterFade} style={styles.count}>
            {items.length}
          </Animated.Text>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>
          <TagChip label="All" selected={!tagFilter} onPress={() => setTagFilter(null)} />
          {PRESET_TAGS.map((tag) => (
            <TagChip key={tag} label={tag} selected={tagFilter === tag} onPress={() => setTagFilter(tagFilter === tag ? null : tag)} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.screen}>
      <AppHeader />
      <FlatList
        data={ready ? visible : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 40 }]}
        refreshControl={
          <RefreshControl refreshing={syncing && ready} onRefresh={() => token && sync(token)} tintColor={colors.accent} colors={[colors.accent]} />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          !ready ? (
            <View>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : tagFilter ? (
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
        renderItem={({ item, index }) => <Row fav={item} index={index} onPress={() => setEditing(item)} />}
      />
      <Watermark />
      <FavoriteEditSheet favorite={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

function Row({ fav, index, onPress }: { fav: Favorite; index: number; onPress: () => void }) {
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 20, flexGrow: 1 },

  header: { paddingBottom: 12, gap: 6 },
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 12, marginTop: 6 },
  titleWords: { justifyContent: "flex-start" },
  title: { fontFamily: fonts.display, fontSize: 64, lineHeight: 72, color: colors.foreground },
  count: { fontFamily: fonts.display, fontSize: 28, lineHeight: 36, color: colors.accent },
  error: { ...typography.caption, color: colors.danger, marginTop: 6 },
  filterScroll: { marginHorizontal: -20, marginTop: 14 },
  filters: { gap: 8, paddingHorizontal: 20 },

  row: { paddingVertical: 20, gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowMeta: { flexDirection: "row", justifyContent: "space-between" },
  mono: { ...typography.label, fontSize: 10, color: colors.muted },
  rowTitle: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34, color: colors.foreground, marginTop: 2 },
  rowTarget: { fontFamily: fonts.sansSemibold, fontSize: 15, color: colors.foreground },
  rowDesc: { ...typography.body, fontSize: 15, lineHeight: 21, color: colors.muted },
  rowTags: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 6 },
  tag: { borderWidth: 1, borderColor: colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  tagTxt: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.accent },
  noteMark: { flexShrink: 1, ...typography.caption, color: colors.muted, fontStyle: "italic" },

  empty: { alignItems: "center", gap: 12, marginTop: 40, paddingHorizontal: 8 },
  emptyTitle: { fontFamily: fonts.display, fontSize: 44, lineHeight: 49, color: colors.foreground, textAlign: "center" },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center", maxWidth: 290 },
  emptyBtn: { marginTop: 10, alignSelf: "stretch" },
  emptyTag: { ...typography.body, color: colors.muted, marginTop: 24 },
});
