import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { FavoriteEditSheet } from "@/components/FavoriteEditSheet";
import { IdeaCard, shareIdea } from "@/components/IdeaCard";
import { SkeletonCard } from "@/components/Skeleton";
import { TagChip } from "@/components/TagChip";
import { ApiError, listFavorites, removeFavorite, updateFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, spacing, typography } from "@/lib/theme";
import { PRESET_TAGS, type Favorite, type PresetTag } from "@/lib/types";

export default function FavoritesScreen() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<PresetTag | null>(null);
  const [editing, setEditing] = useState<Favorite | null>(null);

  const load = useCallback(
    async (isRefresh: boolean) => {
      if (!token) return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const list = await listFavorites(token);
        setFavorites(list);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't load favorites.");
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const remove = useCallback(
    async (id: string) => {
      if (!token) return;
      setRemovingId(id);
      const previous = favorites;
      setFavorites((current) => current.filter((f) => f.id !== id));
      try {
        await removeFavorite(token, id);
      } catch {
        setFavorites(previous);
        setError("Couldn't remove that favorite. Please try again.");
      } finally {
        setRemovingId(null);
      }
    },
    [token, favorites]
  );

  const saveEdit = useCallback(
    async (updates: { notes: string | null; tags: PresetTag[] }) => {
      if (!token || !editing) return;
      try {
        const updated = await updateFavorite(token, editing.id, updates);
        setFavorites((current) => current.map((f) => (f.id === updated.id ? updated : f)));
      } catch {
        setError("Couldn't save your changes. Please try again.");
      }
    },
    [token, editing]
  );

  const visibleFavorites = useMemo(
    () => (tagFilter ? favorites.filter((f) => f.tags?.includes(tagFilter)) : favorites),
    [favorites, tagFilter]
  );

  if (loading) {
    return (
      <View style={styles.list}>
        <Text style={[styles.title, styles.headerSpacing]}>Favorites</Text>
        <View style={styles.skeletonGroup}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={visibleFavorites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.foreground} />
        }
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <Text style={styles.title}>Favorites</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {favorites.length ? (
              <View style={styles.filterRow}>
                <TagChip label="All" selected={!tagFilter} onPress={() => setTagFilter(null)} />
                {PRESET_TAGS.map((tag) => (
                  <TagChip
                    key={tag}
                    label={tag}
                    selected={tagFilter === tag}
                    onPress={() => setTagFilter(tagFilter === tag ? null : tag)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            message={
              tagFilter
                ? "No favorites with that tag yet."
                : "No favorites yet — swipe right on an idea from the Ideas tab to save it here."
            }
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <IdeaCard
            idea={item}
            variant="compact"
            onPress={() => setEditing(item)}
            onShare={() => shareIdea(item)}
            onRemove={() => remove(item.id)}
            removeLoading={removingId === item.id}
          />
        )}
      />
      <FavoriteEditSheet favorite={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    flexGrow: 1,
  },
  headerRow: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerSpacing: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.foreground,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  separator: {
    height: spacing.md,
  },
  skeletonGroup: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
  },
});
