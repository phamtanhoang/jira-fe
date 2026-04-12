import type { StateCreator } from "zustand";
import type { AppStore } from "../use-app-store";
import type { AppSettings } from "@/lib/types";

export type SettingsSlice = AppSettings & {
  loaded: boolean;
};

export const createSettingsSlice: StateCreator<AppStore, [["zustand/devtools", never]], [], SettingsSlice> = () => ({
  name: "",
  logoUrl: "",
  description: "",
  authorName: "",
  authorUrl: "",
  loaded: false,
});
