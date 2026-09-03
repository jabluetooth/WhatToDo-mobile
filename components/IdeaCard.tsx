import { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInUp,
  FadeOutRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { Badge } from "@/components/Badge";
import { colors, spacing, radius, typography } from "@/lib/theme";
import type { RandomIdea } from "@/lib/types";

interface IdeaCardProps {
  idea: RandomIdea;
  variant?: "detail" | "compact";
  favorited?: boolean;
  onToggleFavorite?: () => void;
  favoriteLoading?: boolean;
  onRemove?: () => void;
  removeLoading?: boolean;
}

export function IdeaCard({
  idea,
  variant = "detail",
  favorited,
  onToggleFavorite,
  favoriteLoading,
  onRemove,
  removeLoading,
}: IdeaCardProps) {
  const isDetail = variant === "detail";

  return (
    <Animated.View
      entering={FadeInUp.duration(280)}
      exiting={FadeOutRight.duration(220)}
      layout={Layout.springify().damping(18)}
      style={styles.card}
    >
      <View style={styles.header}>
        <Badge label={idea.platformTag} />
        {onRemove ? (
          <Pressable onPress={onRemove} disabled={removeLoading} hitSlop={8}>
            <Text style={styles.remove}>{removeLoading ? "…" : "Remove"}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.title, isDetail ? typography.title : typography.heading]}>{idea.title}</Text>
      <Text style={styles.targetUser}>{idea.targetUser}</Text>
      <Text style={[styles.description, isDetail && styles.descriptionDetail]}>{idea.description}</Text>

      {onToggleFavorite ? (
        <FavoriteToggle favorited={!!favorited} loading={!!favoriteLoading} onPress={onToggleFavorite} />
      ) : null}
    </Animated.View>
  );
}

function FavoriteToggle({
  favorited,
  loading,
  onPress,
}: {
  favorited: boolean;
  loading: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.3, { damping: 8, stiffness: 300 }), withSpring(1, { damping: 10 }));
  }, [favorited, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable onPress={onPress} disabled={loading} style={styles.favoriteRow} hitSlop={8}>
      {loading ? (
        <ActivityIndicator color={colors.muted} size="small" />
      ) : (
        <Animated.Text style={[styles.favoriteStar, animatedStyle, favorited && styles.favoriteStarActive]}>
          {favorited ? "★" : "☆"}
        </Animated.Text>
      )}
      <Text style={styles.favoriteLabel}>{loading ? "Saving…" : favorited ? "Favorited" : "Favorite"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.foreground,
  },
  targetUser: {
    ...typography.caption,
    color: colors.muted,
    fontStyle: "italic",
  },
  description: {
    ...typography.body,
    color: colors.foreground,
    lineHeight: 20,
  },
  descriptionDetail: {
    lineHeight: 21,
  },
  remove: {
    color: colors.danger,
    fontSize: 13,
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  favoriteStar: {
    fontSize: 20,
    color: colors.muted,
  },
  favoriteStarActive: {
    color: colors.accent,
  },
  favoriteLabel: {
    ...typography.caption,
    color: colors.foreground,
    fontWeight: "600",
  },
});
