import "@/app/globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/components/providers/app-provider";
import { LoggingProvider } from "@/components/providers/logging-provider";
import { PwaProvider } from "@/components/providers/pwa-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ShortcutsProvider } from "@/components/providers/shortcuts-provider";
import { type Locale, defaultLocale, locales } from "@/lib/config/i18n";
import { COOKIE_LOCALE } from "@/lib/constants";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { getAppSettingsServer } from "@/lib/utils/server";

export async function generateMetadata(): Promise<Metadata> {
  const appSettings = await getAppSettingsServer();
  const name = appSettings?.name || "";
  return {
    title: { default: name, template: `%s | ${name}` },
    description: appSettings?.description || "Project management tool",
    manifest: "/manifest.webmanifest",
    themeColor: "#2563eb",
    appleWebApp: { capable: true, title: name },
    ...(appSettings?.logoUrl && { icons: { icon: appSettings.logoUrl } }),
  };
}

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(COOKIE_LOCALE)?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  const appSettings = await getAppSettingsServer();

  return (
    <html lang={locale} suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProvider initialLocale={locale} initialSettings={appSettings}>
            <LoggingProvider>
              <PwaProvider />
              <QueryProvider>
                <ShortcutsProvider>{children}</ShortcutsProvider>
              </QueryProvider>
              <Toaster position="top-right" richColors closeButton />
            </LoggingProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
