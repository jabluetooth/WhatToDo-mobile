// "The Draw" — mirrors the web app's palette and type (WhatToDo/app/globals.css, app/layout.tsx):
// an ink-black ground, cream ink, and one loud acid-lime accent kept for the moment of choice (the
// roll, the primary action, the landed idea's flood) so it keeps its punch. Everything else stays
// neutral.
export const colors = {
  background: "#0B0B09",
  surface: "#151512",
  // Tonal elevation instead of shadows, which don't read against near-black.
  surfaceElevated: "#1C1C18",
  surfacePressed: "#24241F",
  foreground: "#F3F1EA",
  muted: "#8B887D",
  line: "rgba(243,241,234,0.10)",
  lineStrong: "rgba(243,241,234,0.18)",
  accent: "#D4FF3A",
  accentInk: "#0B0B09",
  accentSoft: "rgba(212,255,58,0.12)",
  danger: "#F87171",
  success: "#4ADE80",

  // Older names, kept so every screen reads from one palette while they're migrated.
  foregroundMuted: "#8B887D",
  foregroundSubtle: "#5F5D55",
  border: "rgba(243,241,234,0.10)",
  borderStrong: "rgba(243,241,234,0.18)",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// One family name per weight — React Native ignores fontWeight on custom fonts.
export const fonts = {
  /** Anton: condensed display face for poster moments, always uppercase. */
  display: "Anton_400Regular",
  sans: "Geist_400Regular",
  sansMedium: "Geist_500Medium",
  sansSemibold: "Geist_600SemiBold",
  sansBold: "Geist_700Bold",
  mono: "GeistMono_500Medium",
};

/**
 * Anton's capitals stand 0.86em tall and its descent is 0.33em, and iOS puts the baseline at
 * (lineHeight - descent) from the top — so any line height under ~1.19em crops the tops of the
 * letters. Every Anton style uses at least this ratio.
 */
export const DISPLAY_LEADING = 1.25;

export const typography = {
  /** Poster headline: huge, condensed, uppercase. */
  display: { fontFamily: fonts.display, fontSize: 56, lineHeight: 70, textTransform: "uppercase" as const },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 42, textTransform: "uppercase" as const },
  heading: { fontFamily: fonts.sansSemibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  /** The web's mono kicker: small, uppercase, widely tracked. */
  label: {
    fontFamily: fonts.mono,
    fontSize: 11,
    lineHeight: 14,
    textTransform: "uppercase" as const,
    letterSpacing: 2.6,
  },
};
