import { cookies } from "next/headers";
import type { Metadata } from "next";
import { type Locale, defaultLocale, locales } from "@/lib/config/i18n";
import { COOKIE_LOCALE } from "@/lib/constants";
import { getAppSettingsServer } from "./app-settings-server";
import { generatePageMetadata } from "../metadata";

export function createGenerateMetadata(titleKey: string, descKey?: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(COOKIE_LOCALE)?.value;
    const locale: Locale = locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : defaultLocale;

    const appSettings = await getAppSettingsServer();

    return generatePageMetadata({ locale, titleKey, descKey, appSettings });
  };
}
