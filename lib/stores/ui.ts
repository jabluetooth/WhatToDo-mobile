import { create } from "zustand";

/** App-wide UI state that more than one screen touches: the profile sheet opens from any header. */
interface UiState {
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
}

export const useUi = create<UiState>((set) => ({
  profileOpen: false,
  openProfile: () => set({ profileOpen: true }),
  closeProfile: () => set({ profileOpen: false }),
}));
