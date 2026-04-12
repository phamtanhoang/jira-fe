import type { Metadata } from "next";
import { t, type Locale } from "@/lib/config/i18n";
import type { AppSettings } from "@/lib/types";

export interface MetadataParams {
  locale: Locale;
  titleKey: string;
  descKey?: string;
  appSettings?: Partial<AppSettings> | null;
}

export function generatePageMetadata({
  locale,
  titleKey,
  descKey,
  appSettings,
}: MetadataParams): Metadata {
  const title = t(locale, titleKey as any);
  const description = descKey
    ? t(locale, descKey as any)
    : appSettings?.description || title;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(appSettings?.logoUrl && {
        images: [{ url: appSettings.logoUrl, width: 1200, height: 630 }],
      }),
    },
  };
}
