import { cookies } from "next/headers";
import type { Metadata } from "next";
import { VerifyEmailForm } from "@/features/auth/components";
import { PageHead } from "@/components/page-head";
import { COOKIE_LOCALE } from "@/lib/constants";
import { type Locale, defaultLocale, locales } from "@/lib/config/i18n";
import { generatePageMetadata } from "@/lib/utils/metadata";
import { getAppSettingsServer } from "@/lib/utils/app-settings-server";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(COOKIE_LOCALE)?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  const appSettings = await getAppSettingsServer();

  return generatePageMetadata({
    locale,
    titleKey: "meta.verifyEmailTitle",
    appSettings,
  });
}

export default function VerifyEmailPage() {
  return (
    <>
      <PageHead
        title="Verify Email"
        description="Verify your email address"
      />
      <VerifyEmailForm />
    </>
  );
}
