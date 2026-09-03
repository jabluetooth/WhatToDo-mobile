import type { RandomIdea } from "@/lib/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

/**
 * The web app and this app's API share one deployment (BASE_URL), so this just opens the web
 * app's home page with the idea pre-filled via query params it reads on mount (see WhatToDo's
 * app/page.tsx). Known limitation: this doesn't carry mobile auth into the web session — an
 * unauthenticated browser lands in the web app's guest rate tier, not the signed-in one.
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
