import type { Metadata } from "next";
import { t, type Locale } from "@/lib/config/i18n";
import type { AppSettings } from "@/lib/types";

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
  const appName = appSettings?.name || "Jira";
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
