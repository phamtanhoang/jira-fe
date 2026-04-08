import type { StateCreator } from "zustand";
import type { AppStore } from "../use-app-store";
import type { AppSettings } from "@/lib/types";
import { EMPTY } from "@/lib/constants";
import { getAppSettings } from "@/lib/utils/app-settings";

export type SettingsSlice = AppSettings & {
  loaded: boolean;
  fetchSettings: () => Promise<void>;
};

export const createSettingsSlice: StateCreator<AppStore, [["zustand/devtools", never]], [], SettingsSlice> = (set) => ({
  name: EMPTY.str,
  logoUrl: EMPTY.str,
  description: EMPTY.str,
  authorName: EMPTY.str,
  authorUrl: EMPTY.str,
  loaded: false,

  fetchSettings: async () => {
    try {
      const data = await getAppSettings();
      if (data) {
        set({ ...data, loaded: true }, false, "settings/fetch");
      } else {
        set({ loaded: true }, false, "settings/fetchError");
      }
    } catch {
      set({ loaded: true }, false, "settings/fetchError");
    }
  },
});
