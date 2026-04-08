import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type SettingsSlice, createSettingsSlice, type LocaleSlice, createLocaleSlice } from "./slices";

export type AppStore = SettingsSlice & LocaleSlice;

export const useAppStore = create<AppStore>()(
  devtools(
    (...args) => ({
      ...createSettingsSlice(...args),
      ...createLocaleSlice(...args),
    }),
    { name: "app-store" },
  ),
);
