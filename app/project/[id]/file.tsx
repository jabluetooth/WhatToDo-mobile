import { useEffect, useState } from "react";
import Feather from "@expo/vector-icons/Feather";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProjectFile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AnimatedPressable } from "@/lib/motion";
import { colors, fonts, typography } from "@/lib/theme";

/**
 * Read-only code viewer for one generated file: monospace, line numbers, scrolls both ways so
 * long lines aren't wrapped into something that no longer looks like code.
 */
export default function FileScreen() {
  const { id, path } = useLocalSearchParams<{ id: string; path: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id || !path) return;
    getProjectFile(token, id, path)
      .then((f) => {
        setContent(f.content);
        setTruncated(f.truncated);
      })
      .catch(() => setError("Couldn't open this file."));
  }, [token, id, path]);

  if (!token) return <Redirect href="/sign-in" />;

  const lines = content?.split("\n") ?? [];
  const gutter = String(lines.length).length;
  const name = path?.split("/").pop() ?? "File";

  return (
    <View style={styles.screen}>
      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <AnimatedPressable scale="strong" haptic="light" onPress={() => router.back()} hitSlop={12} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </AnimatedPressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.path} numberOfLines={1}>{path}</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : content === null ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.code}>
            <View>
              {lines.map((line, i) => (
                <View key={i} style={styles.line}>
                  <Text style={[styles.ln, { width: gutter * 9 + 8 }]}>{i + 1}</Text>
                  <Text style={styles.txt} selectable>{line || " "}</Text>
                </View>
              ))}
              {truncated ? <Text style={styles.note}>File shortened for the viewer. The full file is in the repo.</Text> : null}
            </View>
          </ScrollView>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  name: { fontFamily: fonts.sansSemibold, fontSize: 16, color: colors.foreground },
  path: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 2 },
  code: { paddingVertical: 14, paddingRight: 24 },
  line: { flexDirection: "row" },
  ln: { fontFamily: fonts.mono, fontSize: 12, lineHeight: 19, color: colors.foregroundSubtle, textAlign: "right", paddingRight: 12 },
  txt: { fontFamily: fonts.mono, fontSize: 12.5, lineHeight: 19, color: colors.foreground },
  note: { ...typography.caption, color: colors.muted, marginTop: 12, marginLeft: 16 },
  error: { ...typography.body, color: colors.danger, margin: 20 },
});
