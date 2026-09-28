import type { PromptHints, RandomIdea } from "@/lib/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

/**
 * The web app and this app's API share one deployment (BASE_URL), so these open the web app's
 * home page with the idea pre-filled via query params it reads on mount (WhatToDo/app/page.tsx),
 * which then starts the PRD → stack → code flow there. Known limitation: mobile sign-in doesn't
 * carry into the web session, so an unauthenticated browser lands in the guest tier.
 */
export function continueOnWebUrl(idea: RandomIdea): string {
  const params = new URLSearchParams({
    title: idea.title,
    targetUser: idea.targetUser,
    description: idea.description,
    platformTag: idea.platformTag,
  });
  return `${BASE_URL}/?${params.toString()}`;
}

/** Same handoff for a prompt the user wrote themselves, with its hints. */
export function continuePromptOnWebUrl(prompt: string, hints?: PromptHints): string {
  const params = new URLSearchParams({ prompt });
  if (hints?.platform) params.set("platform", hints.platform);
  if (hints?.scopeSize) params.set("scope", hints.scopeSize);
  if (hints?.stackFamiliarity) params.set("stack", hints.stackFamiliarity);
  return `${BASE_URL}/?${params.toString()}`;
}
