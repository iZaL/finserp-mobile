'use client';

import {useEffect, useState} from 'react';
import {useRouter, usePathname} from '@/i18n/navigation';
import {useAuthStore} from '@/lib/stores/auth-store';

const publicRoutes = ['/login'];

export function AuthProvider({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const {isAuthenticated, isLoading, checkAuth} = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check authentication - locale is handled by next-intl automatically
    checkAuth().finally(() => {
      setIsInitialized(true);
    });
  }, [checkAuth]);

  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
    } else if (isAuthenticated && pathname === '/login') {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, pathname, router, isInitialized]);

  // Show loading during initial auth check
  if (!isInitialized || isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="border-primary size-8 animate-spin rounded-full border-4 border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
