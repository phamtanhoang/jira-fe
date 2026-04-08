import "@/app/globals.css";
import { cookies } from "next/headers";
import { Toaster } from "sonner";
import { AppProvider } from "@/components/providers/app-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { type Locale, defaultLocale, locales } from "@/lib/config/i18n";
import { COOKIE_LOCALE } from "@/lib/constants";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { getAppSettingsServer } from "@/lib/utils/server";

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
        <AppProvider initialLocale={locale} initialSettings={appSettings}>
          <QueryProvider>{children}</QueryProvider>
          <Toaster position="top-right" richColors closeButton />
        </AppProvider>
      </body>
    </html>
  );
}
