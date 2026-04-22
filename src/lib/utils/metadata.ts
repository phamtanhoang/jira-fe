import type { Metadata } from "next";
import { t, type Locale, type MessageKey } from "@/lib/config/i18n";
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
  const title = t(locale, titleKey as MessageKey);
  const description = descKey
    ? t(locale, descKey as MessageKey)
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
