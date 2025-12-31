'use client';

import {useState, useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {useTranslations, useLocale} from 'next-intl';
import {useAuthStore} from '@/lib/stores/auth-store';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Box, Globe} from 'lucide-react';
import {Link} from '@/i18n/navigation';

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('login');
  const {login, isAuthenticated} = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      await login(email, password, rememberMe);
      router.push('/');
    } catch (err: unknown) {
      console.error('Login error:', err);
      // Error toast is handled by API interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-h-full w-full max-w-md overflow-y-auto">
        {/* Language Selector */}
        <div className="mb-4 flex justify-end">
          <div className="flex gap-2">
            <Link href="/login" locale="en">
              <Button
                variant={locale === 'en' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
              >
                <Globe className="size-4" />
                English
              </Button>
            </Link>
            <Link href="/login" locale="ar">
              <Button
                variant={locale === 'ar' ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
              >
                <Globe className="size-4" />
                العربية
              </Button>
            </Link>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* Logo */}
          <div className="mb-6 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg dark:bg-blue-500">
              <Box className="size-8" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              ERP Mobile
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('subtitle')}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('email')}
              </label>
              <Input
                id="email"
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11 border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {t('password')}
              </label>
              <Input
                id="password"
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11 border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 cursor-pointer rounded border-gray-300 accent-blue-600 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('rememberMe')}
                </span>
              </label>

              <button
                type="button"
                className="text-sm text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('forgotPassword')}
              </button>
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-blue-600 text-base text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              disabled={isLoading}
            >
              {isLoading ? t('loggingIn') : t('loginButton')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
