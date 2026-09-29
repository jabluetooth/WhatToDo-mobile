import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import {
  ApiError,
  NeedsGithubConnect,
  createProject,
  deleteProject,
  getJobStatus,
  getProject,
  listProjects,
  pushProject,
  startBuild,
} from "@/lib/api";
import { connectGithub } from "@/lib/githubConnect";
import type { JobStatus, PrdSection, ProjectDetail, ProjectSummary, PromptHints, StackRecommendation } from "@/lib/types";

// Projects: specs you kept, code you generated, repos you pushed. Same two-step load as
// favorites (cache first, then server). A running build is polled here, not in a screen, so it
// keeps going while you browse; its job id is persisted so a relaunch picks it back up (the
// server keeps a job for an hour).

const LIST_KEY = "whattodo:projects";
const BUILDS_KEY = "whattodo:builds";
const POLL_MS = 2500;

export interface Build extends JobStatus {
  jobId: string;
}

interface ProjectsState {
  items: ProjectSummary[];
  ready: boolean;
  syncing: boolean;
  error: string | null;
  details: Record<string, ProjectDetail>;
  builds: Record<string, Build>;

  hydrate: () => Promise<void>;
  sync: (token: string) => Promise<void>;
  load: (token: string, id: string) => Promise<ProjectDetail | null>;
  /** Save a spec (and stack) as a project; returns its id. */
  create: (
    token: string,
    spec: { prompt: string; hints?: PromptHints; sections: PrdSection[]; lowConfidence: boolean; stack?: StackRecommendation | null },
  ) => Promise<string>;
  build: (token: string, id: string) => Promise<void>;
  /** Resume polling builds persisted from an earlier run. */
  resumeBuilds: (token: string) => Promise<void>;
  push: (token: string, id: string, isPrivate: boolean) => Promise<string>;
  remove: (token: string, id: string) => Promise<void>;
  reset: () => Promise<void>;
}

const timers: Record<string, ReturnType<typeof setInterval>> = {};

function persistBuilds(builds: Record<string, Build>) {
  const running = Object.fromEntries(
    Object.entries(builds).filter(([, b]) => b.state === "pending" || b.state === "running").map(([id, b]) => [id, b.jobId]),
  );
  AsyncStorage.setItem(BUILDS_KEY, JSON.stringify(running)).catch(() => {});
}

export const useProjects = create<ProjectsState>((set, get) => {
  const setBuild = (id: string, build: Build | null) => {
    set((s) => {
      const builds = { ...s.builds };
      if (build) builds[id] = build;
      else delete builds[id];
      persistBuilds(builds);
      return { builds };
    });
  };

  const poll = (token: string, id: string, jobId: string) => {
    clearInterval(timers[id]);
    const tick = async () => {
      try {
        const status = await getJobStatus(token, jobId);
        setBuild(id, { ...status, jobId });
        if (status.state === "succeeded" || status.state === "failed") {
          clearInterval(timers[id]);
          delete timers[id];
          if (status.state === "succeeded") {
            await Promise.all([get().load(token, id), get().sync(token)]);
          }
        }
      } catch (err) {
        // The server forgot the job (older than an hour): stop polling, refresh the project.
        if (err instanceof ApiError && err.status === 404) {
          clearInterval(timers[id]);
          delete timers[id];
          setBuild(id, null);
          await get().load(token, id);
        }
      }
    };
    timers[id] = setInterval(tick, POLL_MS);
    void tick();
  };

  return {
    items: [],
    ready: false,
    syncing: false,
    error: null,
    details: {},
    builds: {},

    hydrate: async () => {
      if (get().ready) return;
      try {
        const raw = await AsyncStorage.getItem(LIST_KEY);
        if (raw) set({ items: JSON.parse(raw) as ProjectSummary[], ready: true });
      } catch {}
    },

    sync: async (token) => {
      set({ syncing: true, error: null });
      try {
        const items = await listProjects(token);
        set({ items, ready: true });
        AsyncStorage.setItem(LIST_KEY, JSON.stringify(items)).catch(() => {});
      } catch (err) {
        set({ error: err instanceof ApiError ? err.message : "Couldn't refresh your projects.", ready: true });
      } finally {
        set({ syncing: false });
      }
    },

    load: async (token, id) => {
      try {
        const detail = await getProject(token, id);
        set((s) => ({ details: { ...s.details, [id]: detail } }));
        return detail;
      } catch {
        return null;
      }
    },

    create: async (token, spec) => {
      const id = await createProject(token, {
        prompt: spec.prompt,
        hints: spec.hints,
        sections: spec.sections,
        lowConfidence: spec.lowConfidence,
        stack: spec.stack ?? undefined,
      });
      void get().sync(token);
      return id;
    },

    build: async (token, id) => {
      const jobId = await startBuild(token, id);
      setBuild(id, { jobId, state: "pending", progress: 0, message: "Queued", error: null, projectId: id, unvalidated: false });
      poll(token, id, jobId);
    },

    resumeBuilds: async (token) => {
      try {
        const raw = await AsyncStorage.getItem(BUILDS_KEY);
        const running = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        for (const [id, jobId] of Object.entries(running)) {
          if (!timers[id]) poll(token, id, jobId);
        }
      } catch {}
    },

    push: async (token, id, isPrivate) => {
      let repoUrl: string;
      try {
        repoUrl = await pushProject(token, id, isPrivate);
      } catch (err) {
        if (!(err instanceof NeedsGithubConnect)) throw err;
        // First push (or a revoked grant): connect GitHub, then try once more.
        const connected = await connectGithub(token);
        if (!connected) throw new Error("GitHub connection was cancelled.");
        repoUrl = await pushProject(token, id, isPrivate);
      }
      await Promise.all([get().load(token, id), get().sync(token)]);
      return repoUrl;
    },

    remove: async (token, id) => {
      const before = get().items;
      set({ items: before.filter((p) => p.projectId !== id) });
      try {
        await deleteProject(token, id);
        AsyncStorage.setItem(LIST_KEY, JSON.stringify(get().items)).catch(() => {});
      } catch (err) {
        set({ items: before });
        throw err;
      }
    },

    reset: async () => {
      Object.values(timers).forEach(clearInterval);
      for (const k of Object.keys(timers)) delete timers[k];
      set({ items: [], ready: false, syncing: false, error: null, details: {}, builds: {} });
      await AsyncStorage.multiRemove([LIST_KEY, BUILDS_KEY]).catch(() => {});
    },
  };
});

/** A project's display title: a rolled idea's prompt is "Title (who): description". */
export function projectTitle(prompt: string): string {
  const m = prompt.match(/^(.{1,80}?) \(.+?\):/);
  if (m) return m[1];
  return prompt.length > 60 ? `${prompt.slice(0, 57).trimEnd()}…` : prompt;
}
