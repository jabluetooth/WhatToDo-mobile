import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { ApiError, addFavorite, listFavorites, removeFavorite, updateFavorite } from "@/lib/api";
import type { Favorite, PresetTag, RandomIdea } from "@/lib/types";

// Favorites live here, not in each screen: loaded from the device cache first (instant, works
// offline), then refreshed from the backend. Saves, edits and removals update the list right
// away and roll back if the server says no. Same two-step load as se7en's stores.

const CACHE_KEY = "whattodo:favorites";
const TEMP_PREFIX = "local-";

interface FavoritesState {
  items: Favorite[];
  /** A list is on screen (from cache or server). */
  ready: boolean;
  syncing: boolean;
  error: string | null;

  /** Read the cached list. Safe to call more than once. */
  hydrate: () => Promise<void>;
  /** Fetch the authoritative list and cache it. */
  sync: (token: string) => Promise<void>;
  save: (token: string, idea: RandomIdea) => Promise<boolean>;
  edit: (token: string, id: string, updates: { notes: string | null; tags: PresetTag[] }) => Promise<boolean>;
  remove: (token: string, id: string) => Promise<boolean>;
  isSaved: (idea: RandomIdea) => boolean;
  /** Forget everything (sign-out). */
  reset: () => Promise<void>;
}

const sameIdea = (a: RandomIdea, b: RandomIdea) => a.title === b.title && a.description === b.description;

function persist(items: Favorite[]) {
  // Unsaved (still-posting) items aren't cached; they'd come back as ghosts after a restart.
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items.filter((f) => !f.id.startsWith(TEMP_PREFIX)))).catch(() => {});
}

export const useFavorites = create<FavoritesState>((set, get) => ({
  items: [],
  ready: false,
  syncing: false,
  error: null,

  hydrate: async () => {
    if (get().ready) return;
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) set({ items: JSON.parse(raw) as Favorite[], ready: true });
    } catch {
      // A broken cache just means we wait for the server.
    }
  },

  sync: async (token) => {
    set({ syncing: true, error: null });
    try {
      const items = await listFavorites(token);
      set({ items, ready: true });
      persist(items);
    } catch (err) {
      set({ error: err instanceof ApiError ? err.message : "Couldn't refresh your favorites.", ready: true });
    } finally {
      set({ syncing: false });
    }
  },

  save: async (token, idea) => {
    if (get().isSaved(idea)) return true;
    const temp: Favorite = {
      ...idea,
      id: `${TEMP_PREFIX}${Date.now()}`,
      createdAt: new Date().toISOString(),
      notes: null,
      tags: [],
    };
    set((s) => ({ items: [temp, ...s.items], error: null }));
    try {
      const saved = await addFavorite(token, idea);
      set((s) => {
        const items = s.items.map((f) => (f.id === temp.id ? saved : f));
        persist(items);
        return { items };
      });
      return true;
    } catch {
      set((s) => ({ items: s.items.filter((f) => f.id !== temp.id), error: "Couldn't save that idea." }));
      return false;
    }
  },

  edit: async (token, id, updates) => {
    const before = get().items;
    set({ items: before.map((f) => (f.id === id ? { ...f, ...updates } : f)), error: null });
    try {
      const updated = await updateFavorite(token, id, updates);
      set((s) => {
        const items = s.items.map((f) => (f.id === id ? updated : f));
        persist(items);
        return { items };
      });
      return true;
    } catch {
      set({ items: before, error: "Couldn't save your changes." });
      return false;
    }
  },

  remove: async (token, id) => {
    const before = get().items;
    const items = before.filter((f) => f.id !== id);
    set({ items, error: null });
    try {
      await removeFavorite(token, id);
      persist(items);
      return true;
    } catch {
      set({ items: before, error: "Couldn't remove that favorite." });
      return false;
    }
  },

  isSaved: (idea) => get().items.some((f) => sameIdea(f, idea)),

  reset: async () => {
    set({ items: [], ready: false, syncing: false, error: null });
    await AsyncStorage.removeItem(CACHE_KEY).catch(() => {});
  },
}));
