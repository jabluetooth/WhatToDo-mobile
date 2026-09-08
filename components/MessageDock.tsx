import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { colors, radius, spacing } from "@/lib/theme";

export interface DockCharacter {
  id?: string | number;
  emoji: string;
  name: string;
  online: boolean;
}

export interface MessageDockProps {
  characters?: DockCharacter[];
  onMessageSend?: (message: string, character: DockCharacter, index: number) => void;
  onCharacterSelect?: (character: DockCharacter, index: number) => void;
  onDockToggle?: (isExpanded: boolean) => void;
  expandedWidth?: number;
  position?: "bottom" | "top";
  showSparkleButton?: boolean;
  showMenuButton?: boolean;
  placeholder?: (characterName: string) => string;
  closeOnSend?: boolean;
}

const defaultCharacters: DockCharacter[] = [
  { emoji: "✨", name: "Sparkle", online: false },
  { emoji: "🧙‍♂️", name: "Wizard", online: true },
  { emoji: "🦄", name: "Unicorn", online: true },
  { emoji: "🐵", name: "Monkey", online: true },
  { emoji: "🤖", name: "Robot", online: false },
];

/**
 * Native port of the web MessageDock concept: a floating pill that expands from a row of
 * avatar buttons into a per-character text input. Ported from framer-motion/div/Tailwind to
 * reanimated/Pressable/StyleSheet since none of the web primitives run on React Native, and
 * recolored to monochrome — the app's palette (lib/theme.ts) deliberately has no accent color,
 * where the original used a different gradient per character.
 *
 * Tap-outside-to-dismiss isn't ported: doing that properly needs a full-screen portal (Modal),
 * which is more machinery than this component should own. Tap the open avatar again to close.
 */
export function MessageDock({
  characters = defaultCharacters,
  onMessageSend,
  onCharacterSelect,
  onDockToggle,
  expandedWidth = 320,
  position = "bottom",
  showSparkleButton = true,
  showMenuButton = true,
  placeholder = (name) => `Message ${name}...`,
  closeOnSend = true,
}: MessageDockProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const collapsedWidth = useRef(0);
  const measured = useRef(false);

  const width = useSharedValue<number | undefined>(undefined);
  const reducedMotion = useReducedMotion();
  const isExpanded = expandedIndex !== null;
  const selected = isExpanded ? characters[expandedIndex] : null;

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (measured.current) return;
      const w = e.nativeEvent.layout.width;
      if (w > 0) {
        measured.current = true;
        collapsedWidth.current = w;
      }
    },
    [],
  );

  const open = (index: number) => {
    setExpandedIndex(index);
    width.value = reducedMotion
      ? withTiming(expandedWidth, { duration: 150 })
      : withSpring(expandedWidth, { damping: 30, stiffness: 300, mass: 0.8 });
    onCharacterSelect?.(characters[index], index);
    onDockToggle?.(true);
  };

  const close = () => {
    setExpandedIndex(null);
    setMessage("");
    width.value = reducedMotion
      ? withTiming(collapsedWidth.current, { duration: 150 })
      : withSpring(collapsedWidth.current, { damping: 35, stiffness: 500, mass: 0.6 });
    onDockToggle?.(false);
  };

  const handlePress = (index: number) => {
    if (expandedIndex === index) {
      close();
    } else {
      open(index);
    }
  };

  const handleSend = () => {
    if (message.trim() && expandedIndex !== null) {
      onMessageSend?.(message, characters[expandedIndex], expandedIndex);
      setMessage("");
      if (closeOnSend) close();
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    width: width.value,
  }));

  return (
    <View style={[styles.wrapper, position === "top" ? styles.top : styles.bottom]} pointerEvents="box-none">
      <Animated.View
        onLayout={handleLayout}
        style={[styles.pill, containerStyle, isExpanded && styles.pillExpanded]}
      >
        {!isExpanded && showSparkleButton && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Pressable style={styles.iconButton} hitSlop={8} accessibilityLabel="Sparkle">
              <Text style={styles.emoji}>✨</Text>
            </Pressable>
          </Animated.View>
        )}

        {!isExpanded && <View style={styles.separator} />}

        {characters.slice(1, -1).map((character, i) => {
          const index = i + 1;
          if (isExpanded && expandedIndex !== index) return null;
          return (
            <Animated.View key={character.name} entering={FadeIn} exiting={FadeOut}>
              <Pressable
                style={[styles.avatar, isExpanded && styles.avatarExpanded]}
                onPress={() => handlePress(index)}
                accessibilityLabel={`Message ${character.name}`}
              >
                <Text style={styles.emoji}>{character.emoji}</Text>
                {character.online && <View style={styles.onlineDot} />}
              </Pressable>
            </Animated.View>
          );
        })}

        {isExpanded && (
          <Animated.View style={styles.inputWrap} entering={FadeIn} exiting={FadeOut}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder(selected?.name ?? "")}
              placeholderTextColor={colors.foregroundSubtle}
              style={styles.input}
              autoFocus
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
          </Animated.View>
        )}

        {!isExpanded && <View style={styles.separator} />}

        {showMenuButton && !isExpanded && (
          <Animated.View entering={FadeIn} exiting={FadeOut}>
            <Pressable style={styles.iconButton} hitSlop={8} accessibilityLabel="Menu">
              <Feather name="menu" size={20} color={colors.foregroundMuted} />
            </Pressable>
          </Animated.View>
        )}

        {showMenuButton && isExpanded && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.sendButton}>
            <Pressable
              style={styles.sendPressable}
              onPress={handleSend}
              disabled={!message.trim()}
              hitSlop={8}
              accessibilityLabel="Send"
            >
              <Feather name="send" size={16} color={message.trim() ? colors.background : colors.foregroundSubtle} />
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 50,
  },
  bottom: { bottom: spacing.xl },
  top: { top: spacing.xl },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pillExpanded: {
    backgroundColor: colors.surfacePressed,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarExpanded: {
    backgroundColor: colors.foreground,
  },
  emoji: { fontSize: 20 },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surfaceElevated,
  },
  inputWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  input: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.foreground,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
  },
  sendPressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
