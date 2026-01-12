'use client';

import {useState, useEffect} from 'react';
import {useTranslations} from 'next-intl';
import {Search, Loader2, UserCheck} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {ScrollArea} from '@/components/ui/scroll-area';
import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {
  impersonationService,
  type ImpersonateUser,
} from '@/lib/services/impersonation';
import {useImpersonationStore} from '@/lib/stores/impersonation-store';
import {useAuthStore} from '@/lib/stores/auth-store';
import {usePermissions} from '@/lib/stores/permission-store';
import {useDebounce} from '@/hooks/use-debounce';

interface ImpersonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonationDialog({
  open,
  onOpenChange,
}: ImpersonationDialogProps) {
  const t = useTranslations('impersonation');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<ImpersonateUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const {user, setUser, setToken} = useAuthStore();
  const {setOriginalState, startImpersonation} = useImpersonationStore();
  const {loadPermissions} = usePermissions();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, debouncedSearch]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await impersonationService.getUsers(
        debouncedSearch || undefined
      );
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonate = async (targetUser: ImpersonateUser) => {
    if (!user) return;

    setIsStarting(targetUser.id);
    try {
      // Store original user state before impersonating
      const originalToken = localStorage.getItem('auth_token');
      if (originalToken) {
        setOriginalState(user, originalToken);
      }

      // Start impersonation
      await startImpersonation(targetUser.id, (newUser, newToken) => {
        setToken(newToken);
        setUser(newUser);
        loadPermissions(newUser.permission_names || []);
      });

      onOpenChange(false);
      setSearch('');
    } catch (error) {
      console.error('Failed to impersonate:', error);
    } finally {
      setIsStarting(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-2">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
                {t('noUsersFound')}
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((targetUser) => (
                  <div
                    key={targetUser.id}
                    className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-blue-600 text-sm text-white">
                          {getInitials(targetUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{targetUser.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {targetUser.email}
                        </p>
                        <div className="mt-1 flex gap-1">
                          {targetUser.roles.slice(0, 2).map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                          {targetUser.roles.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{targetUser.roles.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleImpersonate(targetUser)}
                      disabled={isStarting !== null}
                    >
                      {isStarting === targetUser.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        t('loginAs')
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
