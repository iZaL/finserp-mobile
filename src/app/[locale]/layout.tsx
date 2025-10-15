import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from "@/components/auth-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { UserMenu } from "@/components/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AuthProvider>
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <SidebarInset>
            <header className="sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 z-40">
              <SidebarTrigger className="-ml-1 md:flex hidden" />
              <Separator orientation="vertical" className="mr-2 h-6 md:flex hidden" />
              <div className="flex flex-1 items-center justify-between gap-2">
                <h1 className="text-sm font-semibold">ERP Mobile</h1>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <UserMenu />
                </div>
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
    </NextIntlClientProvider>
  );
}
