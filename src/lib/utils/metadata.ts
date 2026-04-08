import { cookies } from "next/headers";
import type { Metadata } from "next";
import { t, type Locale, defaultLocale, locales } from "@/lib/config/i18n";
import type { AppSettings } from "@/lib/types";
import { COOKIE_LOCALE } from "@/lib/constants";
import { getAppSettingsServer } from "@/lib/utils/app-settings-server";

export interface MetadataParams {
  locale: Locale;
  titleKey: string;
  appSettings?: Partial<AppSettings> | null;
}

export function generatePageMetadata({
  locale,
  titleKey,
  appSettings,
}: MetadataParams): Metadata {
  const title = t(locale, titleKey as any);
  const appName = appSettings?.name || "";
  const fullTitle = `${title} | ${appName}`;

  return {
    title: fullTitle,
    description: appSettings?.description || `${title} to your account`,
    ...(appSettings?.logoUrl && {
      icons: {
        icon: appSettings.logoUrl,
      },
    }),
    openGraph: {
      title: fullTitle,
      description: appSettings?.description || `${title} to your account`,
      ...(appSettings?.logoUrl && {
        images: [
          {
            url: appSettings.logoUrl,
            width: 1200,
            height: 630,
          },
        ],
      }),
    },
  };
}

export function createGenerateMetadata(titleKey: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(COOKIE_LOCALE)?.value;
    const locale: Locale = locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : defaultLocale;

    const appSettings = await getAppSettingsServer();

    return generatePageMetadata({ locale, titleKey, appSettings });
  };
}
