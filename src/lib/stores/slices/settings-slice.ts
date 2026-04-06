import type { StateCreator } from "zustand";
import type { AppStore } from "../use-app-store";
import type { AppSettings } from "@/lib/types";

export type SettingsSlice = AppSettings & {
  loaded: boolean;
  fetchSettings: () => Promise<void>;
};

export const createSettingsSlice: StateCreator<
  AppStore,
  [["zustand/devtools", never]],
  [],
  SettingsSlice
> = (set) => ({
  appName: "",
  logoUrl: "",
  description: "",
  authorName: "",
  authorUrl: "",
  loaded: false,

  fetchSettings: async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/settings`);
      const data: AppSettings = await res.json();
      set({ ...data, loaded: true }, false, "settings/fetch");
    } catch {
      set({ loaded: true }, false, "settings/fetchError");
    }
  },
});
