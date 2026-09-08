// Matches the web app's forced-dark, monochrome-by-design palette (WhatToDo/app/globals.css) —
// no accent color anywhere, on either app, is a deliberate brand choice, not an oversight.
export const colors = {
  background: "#0A0A0B",
  // Tonal elevation steps (Material 3's dark-theme approach: higher elevation = lighter surface)
  // instead of shadows, which don't read against a near-black background.
  surface: "#151517",
  surfaceElevated: "#1C1C1F",
  surfacePressed: "#242428",
  border: "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.16)",
  foreground: "#F2F2F3",
  foregroundMuted: "#A1A1AA",
  foregroundSubtle: "#6B6B70",
  danger: "#F87171",
  success: "#4ADE80",
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
  xl: 20,
  full: 999,
};

// Explicit fontFamily per weight — React Native ignores fontWeight on a custom font unless it's a
// variable font, so each weight needs its own loaded family name (see app/_layout.tsx's useFonts).
export const typography = {
  display: { fontFamily: "Inter_700Bold", fontSize: 40, lineHeight: 46 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, lineHeight: 30 },
  heading: { fontFamily: "Inter_600SemiBold", fontSize: 18, lineHeight: 24 },
  body: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: "Inter_500Medium", fontSize: 13, lineHeight: 18 },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
};
