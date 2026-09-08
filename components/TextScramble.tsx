import { useEffect, useRef, useState } from "react";
import { Platform, Text, type StyleProp, type TextStyle } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Ported from WhatToDo/app/page.tsx's TextScramble — same constants/algorithm, Text instead of
// span. Kept in sync manually since the two apps don't share a package.
const SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#0123456789";
const SCRAMBLE_DURATION_MS = 2800;
// How often the not-yet-revealed characters reroll to a new random glyph during the reveal —
// independent of SCRAMBLE_DURATION_MS (which governs the overall left-to-right sweep).
const SCRAMBLE_CHAR_INTERVAL_MS = 90;
const LOADING_SCRAMBLE_INTERVAL_MS = 140;
// A short string made the continuous loading scramble narrow enough to visibly shift/reflow the
// centered poster around it — flooring the scrambled length keeps it at least this wide.
const MIN_LOADING_SCRAMBLE_LENGTH = 6;

const MONO_FONT = Platform.select({ ios: "Courier", android: "monospace", default: "monospace" });

function scrambleLike(text: string, minLength: number): string {
  const padded = text.length >= minLength ? text : text + " ".repeat(minLength - text.length);
  let out = "";
  for (let i = 0; i < padded.length; i++) {
    out += padded[i] === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
  }
  return out;
}

/**
 * - While `loading`: continuously re-randomizes every character, purely as a "generating"
 *   indicator — never resolves to anything, never stops on its own.
 * - Once `loading` ends and `play` has changed since the last reveal: locks `text` in
 *   left-to-right over SCRAMBLE_DURATION_MS, random characters standing in for the unrevealed
 *   tail. A `play` that hasn't changed just swaps to `text` instantly instead of animating.
 */
export function TextScramble({
  text,
  play,
  loading,
  style,
}: {
  text: string;
  play: number;
  loading: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const [display, setDisplay] = useState(text);
  const frameRef = useRef<number | null>(null);
  const lastPlayRef = useRef(play);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!loading) return;
    if (reducedMotion) {
      setDisplay(text);
      return;
    }
    const update = () => setDisplay(scrambleLike(text, MIN_LOADING_SCRAMBLE_LENGTH));
    const frame = requestAnimationFrame(update);
    const id = setInterval(update, LOADING_SCRAMBLE_INTERVAL_MS);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [loading, reducedMotion, text]);

  useEffect(() => {
    if (loading) return;
    if (reducedMotion) {
      lastPlayRef.current = play;
      setDisplay(text);
      return;
    }
    if (play === lastPlayRef.current) {
      setDisplay(text);
      return;
    }
    lastPlayRef.current = play;

    const start = performance.now();
    let lastRerollAt = -Infinity;
    let randomChars: string[] = [];
    function tick(now: number) {
      const progress = Math.min((now - start) / SCRAMBLE_DURATION_MS, 1);
      const lockedCount = Math.floor(progress * text.length);

      if (now - lastRerollAt >= SCRAMBLE_CHAR_INTERVAL_MS || randomChars.length !== text.length) {
        randomChars = Array.from(
          { length: text.length },
          () => SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        );
        lastRerollAt = now;
      }

      let out = "";
      for (let i = 0; i < text.length; i++) {
        out += i < lockedCount || text[i] === " " ? text[i] : randomChars[i];
      }
      setDisplay(out);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(text);
      }
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [loading, play, reducedMotion, text]);

  // fontFamily asserted last so a caller's style (e.g. typography.display, for size/color/lineHeight)
  // can't accidentally override the monospace requirement the scramble reveal depends on.
  return <Text style={[style, { fontFamily: MONO_FONT }]}>{display}</Text>;
}
