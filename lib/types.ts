export type PlatformTag = "web" | "mobile";

export interface RandomIdea {
  title: string;
  targetUser: string;
  description: string;
  platformTag: PlatformTag;
}

/** Mirrors WhatToDo/lib/types.ts's PRESET_TAGS — kept in sync manually since the two apps don't share a package. */
export const PRESET_TAGS = ["Weekend project", "Startup idea", "For work", "Someday"] as const;
export type PresetTag = (typeof PRESET_TAGS)[number];

export interface Favorite extends RandomIdea {
  id: string;
  createdAt: string;
  notes: string | null;
  tags: PresetTag[];
}

/** Optional steering for a written-your-own idea (mirrors WhatToDo/lib/types.ts's PromptHints). */
export type ScopeSize = "weekend" | "mvp" | "production";
export interface PromptHints {
  platform?: PlatformTag;
  scopeSize?: ScopeSize;
  /** Free text: stacks you already know, to bias the recommendation. */
  stackFamiliarity?: string;
}

export interface PrdSection {
  key: string;
  title: string;
  content: string;
}

export type StackCategory = "frontend" | "backend" | "database" | "hosting" | "auth";
export type StackRecommendation = Record<StackCategory, { choice: string; rationale: string }>;

export interface MobileUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

// ─── Projects (built on the phone or the web; same History) ───────────────────

export interface ProjectSummary {
  projectId: string;
  prompt: string;
  platform: PlatformTag | null;
  createdAt: string;
  updatedAt: string;
  hasPrd: boolean;
  hasStack: boolean;
  code: { createdAt: string; repoUrl: string | null } | null;
}

export interface ProjectFile {
  path: string;
  size: number;
}

export interface ProjectDetail {
  projectId: string;
  prompt: string;
  hints: PromptHints | null;
  createdAt: string;
  updatedAt: string;
  sections: PrdSection[];
  lowConfidence: boolean;
  stack: StackRecommendation | null;
  code: { createdAt: string; repoUrl: string | null; pushError: string | null; files: ProjectFile[] } | null;
}

export type JobState = "pending" | "running" | "succeeded" | "failed";

export interface JobStatus {
  state: JobState;
  progress: number;
  message: string;
  error: string | null;
  projectId: string | null;
  unvalidated: boolean;
}
