import { StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * Monochrome take on the "radial glow behind a dock" effect (21st.dev/ibelick's
 * background-radial-dark-purple, recolored grayscale to keep the app's no-accent-color rule) —
 * a soft glow rising from the tab bar instead of the gradient being purple-tinted.
 */
export function DockGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="dockGlow" cx="50%" cy="0%" r="75%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.12} />
          <Stop offset="55%" stopColor="#FFFFFF" stopOpacity={0.04} />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#dockGlow)" />
    </Svg>
  );
}
