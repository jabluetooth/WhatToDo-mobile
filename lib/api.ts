import type { Favorite, MobileUser, PlatformTag, PresetTag, RandomIdea } from "@/lib/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function githubStartUrl(redirectUri: string): string {
  return `${BASE_URL}/api/mobile/auth/github/start?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

export function fetchMe(token: string): Promise<MobileUser> {
  return request<MobileUser>("/api/mobile/me", token);
}

export function fetchRandomIdea(token: string, platform?: PlatformTag): Promise<RandomIdea> {
  const query = platform ? `?platform=${platform}` : "";
  return request<RandomIdea>(`/api/mobile/ideas/random${query}`, token);
}

export async function listFavorites(token: string): Promise<Favorite[]> {
  const { favorites } = await request<{ favorites: Favorite[] }>("/api/mobile/favorites", token);
  return favorites;
}

export function addFavorite(token: string, idea: RandomIdea): Promise<Favorite> {
  return request<Favorite>("/api/mobile/favorites", token, {
    method: "POST",
    body: JSON.stringify(idea),
  });
}

export function updateFavorite(
  token: string,
  id: string,
  updates: { notes?: string | null; tags?: PresetTag[] }
): Promise<Favorite> {
  return request<Favorite>(`/api/mobile/favorites/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export function removeFavorite(token: string, id: string): Promise<void> {
  return request<void>(`/api/mobile/favorites/${id}`, token, { method: "DELETE" });
}

export type { MobileUser };
