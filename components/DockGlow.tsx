import { StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * A faint lime glow rising from inside the dock — the same soft accent halo the web hero uses to
 * anchor its Roll button, kept low enough that the lime active tab stays the loudest thing here.
 */
export function DockGlow() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="dockGlow" cx="50%" cy="0%" r="80%">
          <Stop offset="0%" stopColor="#D4FF3A" stopOpacity={0.1} />
          <Stop offset="60%" stopColor="#D4FF3A" stopOpacity={0.03} />
          <Stop offset="100%" stopColor="#D4FF3A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#dockGlow)" />
    </Svg>
  );
}
