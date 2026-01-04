'use client';

import {useRouter} from '@/i18n/navigation';
import {useTranslations} from 'next-intl';
import {
  Play,
  ClipboardList,
  Package,
  ArrowRightLeft,
  ChevronRight,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {usePermissions} from '@/lib/stores/permission-store';
import type {WorkflowState} from './workflow-progress';

interface QuickActionsProps {
  workflowState: WorkflowState;
  activeRunId?: number;
  currentShiftId?: number;
}

export function QuickActions({
  workflowState,
  activeRunId,
  currentShiftId,
}: QuickActionsProps) {
  const router = useRouter();
  const t = useTranslations('productionHub.quickActions');
  const permissions = usePermissions();

  // Determine primary and secondary actions based on state
  const getPrimaryAction = () => {
    switch (workflowState) {
      case 'no_run':
        return {
          label: t('startRun'),
          icon: Play,
          onClick: () => router.push('/production-runs/new'),
          gradient: 'from-emerald-500 to-green-600',
          canShow: permissions.canCreateProductionRun(),
        };
      case 'recording':
        return {
          label: t('recordOutput'),
          icon: ClipboardList,
          onClick: () =>
            router.push(
              `/production-outputs/new${activeRunId ? `?run_id=${activeRunId}` : ''}${currentShiftId ? `&shift_id=${currentShiftId}` : ''}`
            ),
          gradient: 'from-blue-500 to-indigo-600',
          canShow: permissions.canCreateProductionOutput(),
        };
      case 'batching':
        return {
          label: t('createBatch'),
          icon: Package,
          onClick: () => router.push('/production-outputs'),
          gradient: 'from-amber-500 to-orange-600',
          canShow: true,
        };
      case 'transferring':
        return {
          label: t('transferStock'),
          icon: ArrowRightLeft,
          onClick: () => router.push('/batches/transfer'),
          gradient: 'from-violet-500 to-purple-600',
          canShow: permissions.canAccessInventory(),
        };
      default:
        return null;
    }
  };

  const getSecondaryActions = () => {
    const actions = [];

    if (workflowState === 'no_run') {
      actions.push({
        label: t('viewRuns'),
        onClick: () => router.push('/production-runs'),
      });
    }

    if (workflowState === 'recording') {
      actions.push({
        label: t('viewDetails'),
        onClick: () =>
          activeRunId
            ? router.push(`/production-runs/${activeRunId}`)
            : router.push('/production-runs'),
      });
    }

    if (workflowState === 'batching') {
      actions.push({
        label: t('recordMore'),
        onClick: () =>
          router.push(
            `/production-outputs/new${activeRunId ? `?run_id=${activeRunId}` : ''}`
          ),
      });
    }

    if (workflowState === 'transferring') {
      actions.push({
        label: t('viewInventory'),
        onClick: () => router.push('/batches'),
      });
    }

    return actions;
  };

  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();

  if (!primaryAction?.canShow) return null;

  return (
    <div className="space-y-2">
      {/* Primary Action - Large button */}
      <Button
        onClick={primaryAction.onClick}
        className={`h-14 w-full bg-gradient-to-r text-base font-semibold ${primaryAction.gradient} shadow-md`}
      >
        <primaryAction.icon className="me-2 size-5" />
        {primaryAction.label}
        <ChevronRight className="ms-auto size-5" />
      </Button>

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <div className="flex gap-2">
          {secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex-1"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
