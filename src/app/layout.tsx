import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ERP Mobile",
  description: "ERP Mobile Progressive Web App",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ERP Mobile",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 z-40">
                <SidebarTrigger className="-ml-1 md:flex hidden" />
                <Separator orientation="vertical" className="mr-2 h-6 md:flex hidden" />
                <div className="flex flex-1 items-center justify-between gap-2">
                  <h1 className="text-sm font-semibold">ERP Mobile</h1>
                  <UserMenu />
                </div>
              </header>
              <main className="flex flex-1 flex-col gap-4 p-4 pb-20 md:pb-6 md:gap-6 md:p-6">
                {children}
              </main>
            </SidebarInset>
            <MobileNav />
          </SidebarProvider>
          <Toaster
            toastOptions={{
              classNames: {
                toast: "z-[99999] bg-card text-card-foreground border-border shadow-xl",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
