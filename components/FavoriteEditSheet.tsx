import { useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "@/components/Button";
import { Kicker } from "@/components/fx";
import { Sheet } from "@/components/Sheet";
import { TagChip } from "@/components/TagChip";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable, fireHaptic } from "@/lib/motion";
import { shareIdea } from "@/lib/share";
import { useFavorites } from "@/lib/stores/favorites";
import { promptFromIdea, useSpec } from "@/lib/stores/spec";
import { colors, fonts, typography } from "@/lib/theme";
import { PRESET_TAGS, type Favorite, type PresetTag } from "@/lib/types";

interface FavoriteEditSheetProps {
  favorite: Favorite | null;
  onClose: () => void;
}

/**
 * One saved idea: read it, tag it, jot why it stood out, then write its spec (and build it on
 * the web from there), share it, or let it go. Edits save through the favorites store (instant, rolled back on failure).
 */
export function FavoriteEditSheet({ favorite, onClose }: FavoriteEditSheetProps) {
  const { token } = useAuth();
  const router = useRouter();
  const startSpec = useSpec((s) => s.start);
  const edit = useFavorites((s) => s.edit);
  const remove = useFavorites((s) => s.remove);
  const [shown, setShown] = useState<Favorite | null>(favorite);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<PresetTag[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Keep the last favorite on screen while the sheet slides away.
  useEffect(() => {
    if (!favorite) return;
    setShown(favorite);
    setNotes(favorite.notes ?? "");
    setTags(favorite.tags ?? []);
    setConfirmRemove(false);
  }, [favorite]);

  if (!shown) return null;

  const dirty = (notes.trim() || null) !== (shown.notes ?? null) || tags.join() !== (shown.tags ?? []).join();

  const toggleTag = (tag: PresetTag) =>
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]));

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    const ok = await edit(token, shown.id, { notes: notes.trim() || null, tags });
    setSaving(false);
    fireHaptic(ok ? "success" : "warning");
    if (ok) onClose();
  };

  const handleRemove = async () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      fireHaptic("warning");
      return;
    }
    if (!token) return;
    onClose();
    await remove(token, shown.id);
  };

  return (
    <Sheet visible={!!favorite} onClose={onClose}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
        <Kicker>{shown.platformTag}</Kicker>
        <Text style={styles.title}>{shown.title.toUpperCase()}</Text>
        <Text style={styles.target}>{shown.targetUser}</Text>
        <Text style={styles.desc}>{shown.description}</Text>

        <Text style={styles.section}>Tags</Text>
        <View style={styles.tagRow}>
          {PRESET_TAGS.map((tag) => (
            <TagChip key={tag} label={tag} selected={tags.includes(tag)} onPress={() => toggleTag(tag)} />
          ))}
        </View>

        <Text style={styles.section}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Why did this one stand out?"
          placeholderTextColor={colors.foregroundSubtle}
          multiline
          maxLength={2000}
          style={styles.notes}
          accessibilityLabel="Notes"
        />

        <Button
          onPress={() => {
            if (!token) return;
            void startSpec(token, promptFromIdea(shown), { platform: shown.platformTag }, shown);
            onClose();
            router.push("/spec");
          }}
          haptic="medium"
          trailing={<Feather name="arrow-right" size={17} color={colors.accentInk} />}
          accessibilityLabel="Build this: write its spec"
        >
          Build this
        </Button>

        <View style={styles.row}>
          <Button variant="secondary" onPress={() => shareIdea(shown)} style={styles.flex} icon={<Feather name="share" size={16} color={colors.foreground} />}>
            Share
          </Button>
          <Button
            variant="secondary"
            onPress={handleSave}
            loading={saving}
            disabled={!dirty}
            style={styles.flex}
            icon={<Feather name="check" size={16} color={colors.foreground} />}
          >
            Save
          </Button>
        </View>

        <AnimatedPressable onPress={handleRemove} style={styles.remove} accessibilityRole="button" accessibilityLabel={confirmRemove ? "Tap again to remove" : "Remove from Saved"}>
          <Feather name="trash-2" size={15} color={colors.danger} />
          <Text style={styles.removeTxt}>{confirmRemove ? "Tap again to remove" : "Remove from Saved"}</Text>
        </AnimatedPressable>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12, paddingBottom: 4 },
  title: { ...typography.title, color: colors.foreground, marginTop: 2 },
  target: { fontFamily: fonts.sansSemibold, fontSize: 16, lineHeight: 22, color: colors.foreground },
  desc: { ...typography.body, color: colors.muted },
  section: { ...typography.label, color: colors.muted, marginTop: 10 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  notes: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    padding: 14,
    color: colors.foreground,
    textAlignVertical: "top",
    ...typography.body,
    marginBottom: 6,
  },
  row: { flexDirection: "row", gap: 10 },
  flex: { flex: 1 },
  remove: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  removeTxt: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.danger },
});
