type GenerateHandler = () => void;

let handler: GenerateHandler | null = null;

/**
 * Lets the Ideas screen register its own "skip to the next idea" action so the tab bar
 * (_layout.tsx, a sibling with no direct access to the screen's state) can trigger it when
 * the Ideas tab is pressed while already active.
 */
export function setIdeaGenerateHandler(fn: GenerateHandler | null) {
  handler = fn;
}

export function triggerIdeaGenerate() {
  handler?.();
}
