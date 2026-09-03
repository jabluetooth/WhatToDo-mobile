import { useCallback, useEffect, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { IdeaCard } from "@/components/IdeaCard";
import { SkeletonCard } from "@/components/Skeleton";
import { ApiError, listFavorites, removeFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, spacing, typography } from "@/lib/theme";
import type { Favorite } from "@/lib/types";

export default function FavoritesScreen() {
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

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
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.foreground} />
      }
      ListHeaderComponent={
        <View style={styles.headerRow}>
          <Text style={styles.title}>Favorites</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      ListEmptyComponent={
        <EmptyState message="No favorites yet — star an idea from the Ideas tab to save it here." />
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <IdeaCard
          idea={item}
          variant="compact"
          onRemove={() => remove(item.id)}
          removeLoading={removingId === item.id}
        />
      )}
    />
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
    gap: spacing.xs,
  },
  headerSpacing: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.foreground,
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
