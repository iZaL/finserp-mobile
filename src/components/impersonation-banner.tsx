'use client';

import {Eye, X, Loader2} from 'lucide-react';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {useImpersonationStore} from '@/lib/stores/impersonation-store';
import {useAuthStore} from '@/lib/stores/auth-store';
import {usePermissions} from '@/lib/stores/permission-store';
import {useTranslations} from 'next-intl';

export function ImpersonationBanner() {
  const t = useTranslations('impersonation');
  const {isImpersonating, impersonation, stopImpersonation} =
    useImpersonationStore();
  const {setUser, setToken, user} = useAuthStore();
  const {loadPermissions} = usePermissions();
  const [isStopping, setIsStopping] = useState(false);

  if (!isImpersonating || !impersonation) {
    return null;
  }

  const handleStopImpersonation = async () => {
    setIsStopping(true);
    try {
      await stopImpersonation((originalUser, originalToken) => {
        setToken(originalToken);
        setUser(originalUser);
        // Reload permissions for the original user
        loadPermissions(originalUser.permission_names || []);
      });
    } catch (error) {
      console.error('Failed to stop impersonation:', error);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="z-50 flex items-center justify-between bg-amber-500 px-4 py-2 text-white">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate text-sm font-medium">
          {t('viewingAs')} <strong>{user?.name}</strong>
        </span>
        <span className="hidden text-xs opacity-75 sm:inline">
          ({t('loggedInBy')} {impersonation.impersonator_name})
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleStopImpersonation}
        disabled={isStopping}
        className="shrink-0 text-white hover:bg-amber-600 hover:text-white"
      >
        {isStopping ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <X className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{t('stop')}</span>
          </>
        )}
      </Button>
    </div>
  );
}
