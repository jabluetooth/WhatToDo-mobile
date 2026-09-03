import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/Button";
import { IdeaCard } from "@/components/IdeaCard";
import { SkeletonCard } from "@/components/Skeleton";
import { ApiError, addFavorite, fetchRandomIdea, removeFavorite } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radius, spacing, typography } from "@/lib/theme";
import type { RandomIdea } from "@/lib/types";

export default function IdeasScreen() {
  const { token, user, signOut } = useAuth();
  const [idea, setIdea] = useState<RandomIdea | null>(null);
  const [loading, setLoading] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [favoriting, setFavoriting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const next = await fetchRandomIdea(token);
      setIdea(next);
      setFavoriteId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate an idea right now.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const toggleFavorite = useCallback(async () => {
    if (!token || !idea) return;
    setFavoriting(true);
    setError(null);
    try {
      if (favoriteId) {
        await removeFavorite(token, favoriteId);
        setFavoriteId(null);
      } else {
        const saved = await addFavorite(token, idea);
        setFavoriteId(saved.id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that favorite.");
    } finally {
      setFavoriting(false);
    }
  }, [token, idea, favoriteId]);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>What To Do</Text>
          {user?.name ? <Text style={styles.greeting}>Hey, {user.name}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {user ? (
            user.image ? (
              <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )
          ) : null}
          <Pressable onPress={signOut} hitSlop={8}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <SkeletonCard />
      ) : !idea ? (
        <Animated.View entering={FadeIn.duration(300)} style={styles.prompt}>
          <Text style={styles.promptHeadline}>Stuck on thinking what to do?</Text>
          <Text style={styles.promptSubtext}>Generate a random app idea to build.</Text>
        </Animated.View>
      ) : (
        <IdeaCard
          idea={idea}
          variant="detail"
          favorited={!!favoriteId}
          favoriteLoading={favoriting}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button onPress={generate} disabled={loading} loading={loading}>
          {idea ? "Randomize again" : "Generate an idea"}
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: spacing.md,
  },
  headerText: {
    flexShrink: 1,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  title: {
    ...typography.title,
    color: colors.foreground,
  },
  greeting: {
    ...typography.caption,
    color: colors.muted,
    marginTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  signOut: {
    color: colors.muted,
    fontSize: 13,
  },
  prompt: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  promptHeadline: {
    ...typography.heading,
    color: colors.foreground,
  },
  promptSubtext: {
    ...typography.body,
    color: colors.muted,
  },
  actions: {
    gap: spacing.sm,
    marginTop: "auto",
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
});
