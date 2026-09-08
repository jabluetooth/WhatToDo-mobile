import { StyleSheet, Text, View } from "react-native";
import { MessageDock, type DockCharacter } from "@/components/MessageDock";
import { colors, spacing, typography } from "@/lib/theme";

/**
 * Preview-only route for MessageDock — not linked from any tab. Reach it during dev via
 * `expo start --web` and navigating to /dock-demo, or `router.push("/dock-demo")`.
 */
export default function DockDemo() {
  const handleSend = (message: string, character: DockCharacter, index: number) => {
    console.log("Message sent:", { message, character: character.name, index });
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>MessageDock preview</Text>
      <MessageDock onMessageSend={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.foregroundMuted,
  },
});
