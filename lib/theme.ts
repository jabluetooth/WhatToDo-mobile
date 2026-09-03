// Matches the web app's forced-dark palette (WhatToDo/app/globals.css) for brand consistency.
export const colors = {
  background: "#0a0a0a",
  surface: "#161616",
  border: "#2a2a2a",
  foreground: "#ededed",
  muted: "#8a8a8a",
  accent: "#ededed",
  danger: "#f87171",
  success: "#4ade80",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const typography = {
  title: { fontSize: 22, fontWeight: "700" as const },
  heading: { fontSize: 18, fontWeight: "700" as const },
  body: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 13, fontWeight: "400" as const },
  label: { fontSize: 11, fontWeight: "600" as const, textTransform: "uppercase" as const, letterSpacing: 0.5 },
};
