import { StyleSheet, type PressableProps } from "react-native";
import { AnimatedPressable } from "@/lib/motion";

interface DockTabButtonProps extends Omit<PressableProps, "children" | "style"> {
  children: React.ReactNode;
}

/** One dock button: a quick shrink under the finger and a selection tick, sized to the 44pt
    minimum tap target regardless of the icon circle inside it. */
export function DockTabButton({ children, ...rest }: DockTabButtonProps) {
  return (
    <AnimatedPressable {...rest} scale="strong" haptic="selection" style={styles.button}>
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
