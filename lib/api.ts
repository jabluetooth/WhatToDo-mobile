import { API_BASE_URL } from "@/lib/config";
import type {
  Favorite,
  MobileUser,
  PlatformTag,
  PrdSection,
  PresetTag,
  ProjectDetail,
  ProjectSummary,
  JobStatus,
  PromptHints,
  RandomIdea,
  StackRecommendation,
} from "@/lib/types";

const BASE_URL = API_BASE_URL;

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

export type PrdResponse =
  | { needsClarification: true; clarifyingQuestion: string }
  | { needsClarification?: false; sections: PrdSection[]; lowConfidence: boolean };

/** Writes a PRD for a prompt, or asks one clarifying question if the prompt is too vague. */
export function generatePrd(
  token: string,
  body: { prompt: string; hints?: PromptHints; clarification?: { question: string; answer: string } }
): Promise<PrdResponse> {
  return request<PrdResponse>("/api/mobile/prd", token, { method: "POST", body: JSON.stringify(body) });
}

export async function generateStack(
  token: string,
  body: { prompt: string; sections: PrdSection[]; hints?: PromptHints }
): Promise<StackRecommendation> {
  const { stack } = await request<{ stack: StackRecommendation }>("/api/mobile/stack", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return stack;
}

export type { MobileUser };

// ─── Projects, builds and GitHub ──────────────────────────────────────────────

export async function listProjects(token: string): Promise<ProjectSummary[]> {
  const { projects } = await request<{ projects: ProjectSummary[] }>("/api/mobile/projects", token);
  return projects;
}

export async function createProject(
  token: string,
  body: { prompt: string; hints?: PromptHints; sections: PrdSection[]; lowConfidence: boolean; stack?: StackRecommendation }
): Promise<string> {
  const { projectId } = await request<{ projectId: string }>("/api/mobile/projects", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return projectId;
}

export function getProject(token: string, id: string): Promise<ProjectDetail> {
  return request<ProjectDetail>(`/api/mobile/projects/${id}`, token);
}

export function deleteProject(token: string, id: string): Promise<void> {
  return request<void>(`/api/mobile/projects/${id}`, token, { method: "DELETE" });
}

export function saveProjectStack(token: string, id: string, stack: StackRecommendation): Promise<{ stack: StackRecommendation }> {
  return request(`/api/mobile/projects/${id}/stack`, token, { method: "PUT", body: JSON.stringify({ stack }) });
}

export async function startBuild(token: string, id: string): Promise<string> {
  const { jobId } = await request<{ jobId: string }>(`/api/mobile/projects/${id}/boilerplate`, token, { method: "POST" });
  return jobId;
}

export function getJobStatus(token: string, jobId: string): Promise<JobStatus> {
  return request<JobStatus>(`/api/mobile/jobs/${jobId}`, token);
}

export function getProjectFile(
  token: string,
  id: string,
  path: string
): Promise<{ path: string; content: string; truncated: boolean; size: number }> {
  return request(`/api/mobile/projects/${id}/file?path=${encodeURIComponent(path)}`, token);
}

/** Thrown when pushing needs the one-time GitHub repo grant first. */
export class NeedsGithubConnect extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NeedsGithubConnect";
  }
}

export async function pushProject(token: string, id: string, isPrivate: boolean): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/mobile/projects/${id}/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ private: isPrivate }),
  });
  const body = await res.json().catch(() => null);
  if (res.status === 409 && body?.needsGithubConnect) throw new NeedsGithubConnect(body.error ?? "Connect GitHub to push.");
  if (!res.ok) throw new ApiError(body?.error ?? `Push failed (${res.status})`, res.status);
  return body.repoUrl as string;
}

export function githubStatus(token: string): Promise<{ connected: boolean; login: string | null }> {
  return request("/api/mobile/github", token);
}

export async function githubConnectUrl(token: string, redirectUri: string): Promise<string> {
  const { url } = await request<{ url: string }>("/api/mobile/github/connect", token, {
    method: "POST",
    body: JSON.stringify({ redirect_uri: redirectUri }),
  });
  return url;
}
