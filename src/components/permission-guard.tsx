'use client';

import {useEffect} from 'react';
import {useRouter} from '@/i18n/navigation';
import {usePermissions} from '@/lib/stores/permission-store';
import {useTranslations} from 'next-intl';
import {ShieldX} from 'lucide-react';
import {Button} from '@/components/ui/button';

interface PermissionGuardProps {
  children: React.ReactNode;
  /** Permission check function - should return true if user has access */
  check: () => boolean;
  /** Optional: Redirect to this path instead of showing access denied */
  redirectTo?: string;
  /** Optional: Show loading state while checking permissions */
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  check,
  redirectTo,
  fallback,
}: PermissionGuardProps) {
  const router = useRouter();
  const t = useTranslations('common');
  const hasAccess = check();

  useEffect(() => {
    if (!hasAccess && redirectTo) {
      router.replace(redirectTo);
    }
  }, [hasAccess, redirectTo, router]);

  if (!hasAccess) {
    if (redirectTo) {
      return (
        fallback || (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
          </div>
        )
      );
    }

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="bg-destructive/10 rounded-full p-4">
          <ShieldX className="text-destructive size-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t('accessDenied')}</h2>
          <p className="text-muted-foreground max-w-md">
            {t('accessDeniedDescription')}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/')}>
          {t('backToHome')}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

// Pre-built guards for common use cases
export function VehicleBookingGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canAccessVehicleBookings()}>
      {children}
    </PermissionGuard>
  );
}

export function VehicleBookingCreateGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canCreateVehicleBooking()}>
      {children}
    </PermissionGuard>
  );
}

export function VehicleBookingReportsGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canViewVehicleBookingReports()}>
      {children}
    </PermissionGuard>
  );
}

export function BillAttachmentsGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canViewBillAttachments()}>
      {children}
    </PermissionGuard>
  );
}

export function ProductionRunsGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canAccessProductionRuns()}>
      {children}
    </PermissionGuard>
  );
}

export function ProductionOutputsGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canAccessProductionOutputs()}>
      {children}
    </PermissionGuard>
  );
}

export function InventoryGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canAccessInventory()}>
      {children}
    </PermissionGuard>
  );
}

export function BatchesGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canAccessBatches()}>
      {children}
    </PermissionGuard>
  );
}

export function FishPurchasesGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canAccessFishPurchases()}>
      {children}
    </PermissionGuard>
  );
}

export function SuppliersGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canViewSuppliers()}>
      {children}
    </PermissionGuard>
  );
}

export function HandoverGuard({children}: {children: React.ReactNode}) {
  const permissions = usePermissions();
  return (
    <PermissionGuard check={() => permissions.canHandoverShift()}>
      {children}
    </PermissionGuard>
  );
}
