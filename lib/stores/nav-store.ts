import { create } from "zustand";

interface NavStore {
  navigating: boolean;
  setNavigating: (navigating: boolean) => void;
}

export const useNavStore = create<NavStore>((set) => ({
  navigating: false,
  setNavigating: (navigating) => set({ navigating }),
}));
