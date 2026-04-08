import type { StateCreator } from "zustand";
import type { AppStore } from "../use-app-store";
import { type Locale, type MessageKey, defaultLocale, t as translate } from "@/lib/config/i18n";
import { COOKIE_LOCALE, COOKIE_MAX_AGE_1Y } from "@/lib/constants";

type LocaleState = {
  locale: Locale;
};

type LocaleActions = {
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
};

export type LocaleSlice = LocaleState & LocaleActions;

export const createLocaleSlice: StateCreator<AppStore, [["zustand/devtools", never]], [], LocaleSlice> = (set, get) => ({
  locale: defaultLocale,

  setLocale: (locale: Locale) => {
    set({ locale }, false, "locale/set");
    document.cookie = `${COOKIE_LOCALE}=${locale};path=/;max-age=${COOKIE_MAX_AGE_1Y}`;
    window.location.reload();
  },

  t: (key: MessageKey, vars?: Record<string, string>) => {
    const { locale, name } = get();
    return translate(locale, key, { name, ...vars });
  },
});
