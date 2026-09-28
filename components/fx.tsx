import { type ReactNode } from "react";
import { Image, StyleSheet, Text, View, type ColorValue, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { FadeInUp, ReduceMotion } from "react-native-reanimated";
import Svg, { Circle, Rect } from "react-native-svg";
import { EASE } from "@/lib/motion";
import { colors, fonts, typography } from "@/lib/theme";

/**
 * Film grain over the whole app (web: body::after SVG noise at 6% opacity), so the flat ink ground
 * reads as printed matter. A pre-rendered noise tile, repeated; never interactive.
 */
export function Grain() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image source={require("../assets/grain.png")} resizeMode="repeat" style={[StyleSheet.absoluteFill, { opacity: 0.05 }]} />
    </View>
  );
}

/**
 * The decorative "WHAT TO DO?" line at the foot of a screen (web: components/Watermark.tsx),
 * faint and cropped at its base. Purely cosmetic, hidden from screen readers.
 */
export function Watermark({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[wm.wrap, style]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Text style={wm.text} numberOfLines={1} adjustsFontSizeToFit>
        WHAT TO DO?
      </Text>
    </View>
  );
}

const wm = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, height: 64, overflow: "hidden", alignItems: "center" },
  text: { fontFamily: fonts.display, fontSize: 96, lineHeight: 108, color: "rgba(243,241,234,0.045)", letterSpacing: -1 },
});

/** Small uppercase mono label with a lime dot, above section headlines (web: <Kicker>). */
export function Kicker({ children, style, dot = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; dot?: boolean }) {
  return (
    <View style={[kk.row, style]}>
      {dot && <View style={kk.dot} />}
      <Text style={kk.text}>{children}</Text>
    </View>
  );
}

const kk = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  text: { ...typography.label, color: colors.muted },
});

/** The web's dice glyph (components/IdeaRoller.tsx's DiceIcon). */
export function DiceIcon({ size = 20, color = colors.foreground }: { size?: number; color?: ColorValue }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={3.5} width={17} height={17} rx={4} stroke={color} strokeWidth={2} />
      <Circle cx={8.5} cy={8.5} r={1.3} fill={color} />
      <Circle cx={15.5} cy={15.5} r={1.3} fill={color} />
      <Circle cx={12} cy={12} r={1.3} fill={color} />
    </Svg>
  );
}

/**
 * Headline words that rise from behind their own baseline, one after another (web: <LineReveal>
 * and the hero's WHAT / TO / DO). Each word sits in a mask so only the rise is clipped.
 */
export function RiseWords({
  words,
  style,
  delay = 0,
  step = 100,
  wordStyle,
}: {
  words: string[];
  style?: StyleProp<ViewStyle>;
  delay?: number;
  step?: number;
  wordStyle?: StyleProp<TextStyle>;
}) {
  const flat = StyleSheet.flatten(wordStyle) ?? {};
  const fs = typeof flat.fontSize === "number" ? flat.fontSize : 48;
  const pad = Math.round(fs * 0.18);
  const lineHeight = Math.max(typeof flat.lineHeight === "number" ? flat.lineHeight : 0, Math.round(fs * 1.12));
  return (
    <View style={[rw.row, style]}>
      {words.map((w, i) => (
        <View key={`${w}-${i}`} style={[rw.mask, { paddingVertical: pad, marginVertical: -pad }]}>
          <Animated.Text
            entering={FadeInUp.duration(1000)
              .easing(EASE)
              .delay(delay + i * step)
              .withInitialValues({ opacity: 1, transform: [{ translateY: lineHeight + pad }] })
              .reduceMotion(ReduceMotion.System)}
            style={[wordStyle, { lineHeight }]}
          >
            {w}
          </Animated.Text>
        </View>
      ))}
    </View>
  );
}

const rw = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 10 },
  mask: { overflow: "hidden" },
});
