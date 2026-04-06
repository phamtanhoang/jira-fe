import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type SettingsSlice, createSettingsSlice } from "./slices/settings-slice";
import { type LocaleSlice, createLocaleSlice } from "./slices/locale-slice";

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
