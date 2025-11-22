import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/components/query-provider";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { InstallPrompt } from "@/components/install-prompt";
import { InstallFAB } from "@/components/install-fab";
import { RefetchIndicator } from "@/components/refetch-indicator";
import { Toaster } from "@/components/ui/sonner";
import { isRTL } from "@/lib/utils";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FinsERP Mobile",
  description: "FinsERP Mobile Progressive Web App",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-touch-icon-76x76.png", sizes: "76x76", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinsERP Mobile",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params in Next.js 15
  const { locale } = await params;

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Set direction based on locale
  const dir = isRTL(locale) ? 'rtl' : 'ltr';

  return (
    <html key={locale} lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AuthProvider>
                <ServiceWorkerRegister />
                <InstallPrompt />
                <InstallFAB />
                <RefetchIndicator />
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
                <Toaster
                  position="top-center"
                  offset="80px"
                  closeButton
                  toastOptions={{
                    classNames: {
                      toast: "z-[99999] shadow-xl border",
                      success: "!bg-emerald-50 dark:!bg-emerald-950/50 !text-emerald-900 dark:!text-emerald-100 !border-emerald-200 dark:!border-emerald-800",
                      error: "!bg-red-50 dark:!bg-red-950/50 !text-red-900 dark:!text-red-100 !border-red-200 dark:!border-red-800",
                      warning: "!bg-amber-50 dark:!bg-amber-950/50 !text-amber-900 dark:!text-amber-100 !border-amber-200 dark:!border-amber-800",
                      info: "!bg-blue-50 dark:!bg-blue-950/50 !text-blue-900 dark:!text-blue-100 !border-blue-200 dark:!border-blue-800",
                      default: "!bg-card !text-card-foreground !border-border",
                      actionButton: "!bg-primary !text-primary-foreground hover:!bg-primary/90",
                      cancelButton: "!bg-muted !text-muted-foreground hover:!bg-muted/80",
                      closeButton: "!bg-transparent hover:!bg-black/5 dark:hover:!bg-white/5 !text-current !border-current/20",
                    },
                  }}
                />
              </AuthProvider>
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
