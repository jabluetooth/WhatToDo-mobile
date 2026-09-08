import { useEffect } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from "react-native";
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

const AnimatedIonicons = Animated.createAnimatedComponent(Ionicons);

interface IdeaCardProps {
  idea: RandomIdea;
  variant?: "detail" | "compact";
  favorited?: boolean;
  onToggleFavorite?: () => void;
  favoriteLoading?: boolean;
  onRemove?: () => void;
  removeLoading?: boolean;
  /** Tapping the card body (not the header actions) — used by the Favorites list to open the edit sheet. */
  onPress?: () => void;
  /** Shows a "Share" text action in the header when set. Omit to let a caller (e.g. FavoriteEditSheet) handle sharing itself. */
  onShare?: () => void;
}

export function IdeaCard({
  idea,
  variant = "detail",
  favorited,
  onToggleFavorite,
  favoriteLoading,
  onRemove,
  removeLoading,
  onPress,
  onShare,
}: IdeaCardProps) {
  const isDetail = variant === "detail";

  const content = (
    <Animated.View
      entering={FadeInUp.duration(280)}
      exiting={FadeOutRight.duration(220)}
      layout={Layout.springify().damping(18)}
      style={styles.card}
    >
      <View style={styles.header}>
        <Badge label={idea.platformTag} />
        <View style={styles.headerActions}>
          {onShare ? (
            <Pressable onPress={onShare} hitSlop={8}>
              <Text style={styles.headerAction}>Share</Text>
            </Pressable>
          ) : null}
          {onRemove ? (
            <Pressable onPress={onRemove} disabled={removeLoading} hitSlop={8}>
              <Text style={styles.remove}>{removeLoading ? "…" : "Remove"}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Text style={[styles.title, isDetail ? typography.title : typography.heading]}>{idea.title}</Text>
      <Text style={styles.targetUser}>{idea.targetUser}</Text>
      <Text style={[styles.description, isDetail && styles.descriptionDetail]}>{idea.description}</Text>

      {onToggleFavorite ? (
        <FavoriteToggle favorited={!!favorited} loading={!!favoriteLoading} onPress={onToggleFavorite} />
      ) : null}
    </Animated.View>
  );

  if (!onPress) return content;

  return <Pressable onPress={onPress}>{content}</Pressable>;
}

export function shareIdea(idea: RandomIdea) {
  Share.share({ message: `${idea.title}\n\n${idea.description}` });
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
        <ActivityIndicator color={colors.foregroundMuted} size="small" />
      ) : (
        <AnimatedIonicons
          name={favorited ? "star" : "star-outline"}
          size={20}
          color={favorited ? colors.foreground : colors.foregroundMuted}
          style={animatedStyle}
        />
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
  headerActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  headerAction: {
    ...typography.caption,
    color: colors.foregroundMuted,
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    color: colors.foreground,
  },
  targetUser: {
    ...typography.caption,
    color: colors.foregroundMuted,
    fontStyle: "italic",
  },
  description: {
    ...typography.body,
    color: colors.foreground,
  },
  descriptionDetail: {
    lineHeight: 23,
  },
  remove: {
    ...typography.caption,
    color: colors.danger,
    fontFamily: "Inter_600SemiBold",
  },
  favoriteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  favoriteLabel: {
    ...typography.caption,
    color: colors.foreground,
    fontFamily: "Inter_600SemiBold",
  },
});
