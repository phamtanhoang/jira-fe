import { cookies } from "next/headers";
import type { Metadata } from "next";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { COOKIE_LOCALE } from "@/lib/constants";
import { type Locale, defaultLocale, locales, t } from "@/lib/config/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(COOKIE_LOCALE)?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  return {
    description: t(locale as Locale, "auth.signInDesc" as any, { name: "Jira" }),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
