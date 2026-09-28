import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, typography } from "@/lib/theme";

/** Inline **bold** inside a line of PRD text. */
function Inline({ text, style }: { text: string; style: object }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <Text key={i} style={styles.bold}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

/**
 * Renders the model's PRD text: paragraphs, "- " / "* " / "1." list items and **bold**. Anything
 * else stays plain text, so an unexpected format still reads fine.
 */
export function RichText({ text, color = colors.foreground }: { text: string; color?: string }) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return (
    <View style={styles.body}>
      {lines.map((line, i) => {
        const item = line.match(/^(?:[-*•]|(\d+)[.)])\s+(.*)$/);
        if (item) {
          return (
            <View key={i} style={styles.li}>
              <Text style={[styles.marker, { color: colors.accent }]}>{item[1] ? `${item[1]}.` : "—"}</Text>
              <Inline text={item[2]} style={[styles.p, { color, flex: 1 }]} />
            </View>
          );
        }
        const heading = line.match(/^#{1,4}\s+(.*)$/);
        if (heading) return <Text key={i} style={[styles.h, { color }]}>{heading[1]}</Text>;
        return <Inline key={i} text={line} style={[styles.p, { color }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: 8 },
  p: { ...typography.body },
  bold: { fontFamily: fonts.sansSemibold },
  h: { fontFamily: fonts.sansSemibold, fontSize: 16, marginTop: 4 },
  li: { flexDirection: "row", gap: 10 },
  marker: { width: 20, fontFamily: fonts.mono, fontSize: 13, lineHeight: 23, textAlign: "right" },
});
