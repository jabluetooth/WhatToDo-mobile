import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/** Mirrors the OS "Reduce Motion" accessibility setting, live — the RN equivalent of the web
    MessageDock reference component's framer-motion useReducedMotion(), which this app's reanimated
    port had been missing. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
