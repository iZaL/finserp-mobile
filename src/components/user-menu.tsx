'use client';

import {useState} from 'react';
import {LogOut, User, UserCheck} from 'lucide-react';
import {useRouter} from '@/i18n/navigation';
import {useAuthStore} from '@/lib/stores/auth-store';
import {useImpersonationStore} from '@/lib/stores/impersonation-store';
import {usePermissions} from '@/lib/stores/permission-store';
import {useTranslations} from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {Button} from '@/components/ui/button';
import {ImpersonationDialog} from '@/components/impersonation-dialog';

export function UserMenu() {
  const router = useRouter();
  const {user, logout} = useAuthStore();
  const {isImpersonating, clearImpersonation} = useImpersonationStore();
  const {canImpersonateUsers} = usePermissions();
  const t = useTranslations('navigation');
  const tImpersonation = useTranslations('impersonation');
  const [showImpersonationDialog, setShowImpersonationDialog] = useState(false);

  const handleLogout = async () => {
    // Clear impersonation state on logout
    if (isImpersonating) {
      clearImpersonation();
    }
    await logout();
    router.push('/login');
  };

  // Only show impersonation option if user can impersonate and is not currently impersonating
  const showImpersonateOption = canImpersonateUsers() && !isImpersonating;

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative size-8 rounded-full p-0">
            <Avatar className="size-8">
              <AvatarFallback className="bg-blue-600 text-xs text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="bg-card text-card-foreground border-border z-[99999] w-56 shadow-xl"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs leading-none">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="me-2 size-4" />
            {t('profile')}
          </DropdownMenuItem>
          {showImpersonateOption && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowImpersonationDialog(true)}
                className="text-blue-600 dark:text-blue-400"
              >
                <UserCheck className="me-2 size-4" />
                {tImpersonation('title')}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="text-red-600 dark:text-red-400"
          >
            <LogOut className="me-2 size-4" />
            {t('logout')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ImpersonationDialog
        open={showImpersonationDialog}
        onOpenChange={setShowImpersonationDialog}
      />
    </>
  );
}
