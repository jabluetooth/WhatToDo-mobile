import { create } from "zustand";
import { ApiError, generatePrd, generateStack } from "@/lib/api";
import type { PrdSection, PromptHints, RandomIdea, StackRecommendation } from "@/lib/types";

// The one spec being written: a prompt (typed, or built from a rolled idea) → maybe one
// clarifying question → PRD sections → optional stack. Held here so the Ideas screen, the
// composer and the spec screen all see the same thing.

export type SpecStatus = "idle" | "writing" | "clarify" | "ready" | "error";

interface SpecState {
  prompt: string;
  hints: PromptHints | undefined;
  /** Set when the spec started from a rolled or saved idea (lets the spec screen offer Save). */
  idea: RandomIdea | null;
  status: SpecStatus;
  question: string | null;
  sections: PrdSection[];
  lowConfidence: boolean;
  error: string | null;
  stack: StackRecommendation | null;
  stackLoading: boolean;
  stackError: string | null;
  /** Set once this spec has been kept as a project, so keeping or building it again reuses it. */
  projectId: string | null;

  start: (token: string, prompt: string, hints?: PromptHints, idea?: RandomIdea | null) => Promise<void>;
  answer: (token: string, answer: string) => Promise<void>;
  retry: (token: string) => Promise<void>;
  recommendStack: (token: string) => Promise<void>;
  reset: () => void;
}

/** The same prompt the web builds from an idea (WhatToDo/app/page.tsx's startPrdFromIdea). */
export function promptFromIdea(idea: RandomIdea): string {
  return `${idea.title} (${idea.targetUser}): ${idea.description}`;
}

const message = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

const blank = {
  question: null,
  sections: [],
  lowConfidence: false,
  error: null,
  stack: null,
  stackLoading: false,
  stackError: null,
  projectId: null,
};

export const useSpec = create<SpecState>((set, get) => ({
  prompt: "",
  hints: undefined,
  idea: null,
  status: "idle",
  ...blank,

  start: async (token, prompt, hints, idea = null) => {
    set({ prompt, hints, idea, status: "writing", ...blank });
    try {
      const res = await generatePrd(token, { prompt, hints });
      if (get().prompt !== prompt) return; // a newer spec started meanwhile
      if (res.needsClarification) set({ status: "clarify", question: res.clarifyingQuestion });
      else set({ status: "ready", sections: res.sections, lowConfidence: res.lowConfidence });
    } catch (err) {
      if (get().prompt === prompt) set({ status: "error", error: message(err, "Couldn't reach the spec writer. Check your connection.") });
    }
  },

  answer: async (token, answer) => {
    const { prompt, hints, question } = get();
    if (!question) return;
    set({ status: "writing", error: null });
    try {
      const res = await generatePrd(token, { prompt, hints, clarification: { question, answer } });
      if (res.needsClarification) set({ status: "clarify", question: res.clarifyingQuestion });
      else set({ status: "ready", sections: res.sections, lowConfidence: res.lowConfidence });
    } catch (err) {
      set({ status: "clarify", error: message(err, "Couldn't send your answer. Try again.") });
    }
  },

  retry: async (token) => {
    const { prompt, hints, idea } = get();
    if (prompt) await get().start(token, prompt, hints, idea);
  },

  recommendStack: async (token) => {
    const { prompt, sections, hints } = get();
    if (!sections.length) return;
    set({ stackLoading: true, stackError: null });
    try {
      const stack = await generateStack(token, { prompt, sections, hints });
      set({ stack, stackLoading: false });
    } catch (err) {
      set({ stackLoading: false, stackError: message(err, "Couldn't recommend a stack right now.") });
    }
  },

  reset: () => set({ prompt: "", hints: undefined, idea: null, status: "idle", ...blank }),
}));
