import type { StateCreator } from "zustand";
import type { AppStore } from "../use-app-store";
import type { AppSettings } from "@/lib/types";
import { EMPTY } from "@/lib/constants";

export type SettingsSlice = AppSettings & {
  loaded: boolean;
};

export const createSettingsSlice: StateCreator<AppStore, [["zustand/devtools", never]], [], SettingsSlice> = () => ({
  name: EMPTY.str,
  logoUrl: EMPTY.str,
  description: EMPTY.str,
  authorName: EMPTY.str,
  authorUrl: EMPTY.str,
  loaded: false,
});
