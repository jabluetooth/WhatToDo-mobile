import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Button } from "@/components/Button";
import { shareIdea } from "@/components/IdeaCard";
import { TagChip } from "@/components/TagChip";
import { continueOnWebUrl } from "@/lib/webLink";
import { colors, radius, spacing, typography } from "@/lib/theme";
import { PRESET_TAGS, type Favorite, type PresetTag } from "@/lib/types";

interface FavoriteEditSheetProps {
  favorite: Favorite | null;
  onClose: () => void;
  onSave: (updates: { notes: string | null; tags: PresetTag[] }) => Promise<void>;
}

export function FavoriteEditSheet({ favorite, onClose, onSave }: FavoriteEditSheetProps) {
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<PresetTag[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (favorite) {
      setNotes(favorite.notes ?? "");
      setTags(favorite.tags ?? []);
    }
  }, [favorite]);

  if (!favorite) return null;

  const toggleTag = (tag: PresetTag) => {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ notes: notes.trim() || null, tags });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const continueOnWeb = () => {
    WebBrowser.openBrowserAsync(continueOnWebUrl(favorite));
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.dragHandle} />
        <Text style={styles.title}>{favorite.title}</Text>
        <Text style={styles.targetUser}>{favorite.targetUser}</Text>

        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagRow}>
          {PRESET_TAGS.map((tag) => (
            <TagChip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
          ))}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Why did this one stand out?"
          placeholderTextColor={colors.foregroundMuted}
          multiline
          style={styles.notesInput}
        />

        <View style={styles.actionsRow}>
          <Pressable onPress={() => shareIdea(favorite)} hitSlop={8}>
            <Text style={styles.linkAction}>Share</Text>
          </Pressable>
          <Pressable onPress={continueOnWeb} hitSlop={8}>
            <Text style={styles.linkAction}>Continue building on web →</Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Button variant="secondary" onPress={onClose} style={styles.flexButton}>
            Cancel
          </Button>
          <Button onPress={handleSave} loading={saving} style={styles.flexButton}>
            Save
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  dragHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    color: colors.foreground,
  },
  targetUser: {
    ...typography.caption,
    color: colors.foregroundMuted,
    fontStyle: "italic",
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.foregroundMuted,
    marginTop: spacing.sm,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    minHeight: 80,
    color: colors.foreground,
    textAlignVertical: "top",
    ...typography.body,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  linkAction: {
    ...typography.caption,
    color: colors.foreground,
    fontFamily: "Inter_600SemiBold",
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  flexButton: {
    flex: 1,
  },
});
