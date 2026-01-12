'use client';

import {use, useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import {format, parseISO, differenceInDays} from 'date-fns';
import {ArrowLeft, RefreshCw, Plus, Calendar, Lock} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Skeleton} from '@/components/ui/skeleton';
import {
  ShiftHero,
  ShiftTimeline,
  BagStackVisual,
  TankFillGauge,
  RunCardExpandable,
} from '@/components/production/shift-detail';
import {useShiftDetail} from '@/hooks/use-shift-detail';
import {ProductionRunsGuard} from '@/components/permission-guard';
import {usePermissions} from '@/lib/stores/permission-store';
import {cn} from '@/lib/utils';

interface PageProps {
  params: Promise<{
    date: string;
    shiftId: string;
  }>;
}

export default function ShiftDetailPage({params}: PageProps) {
  const {date, shiftId: shiftIdStr} = use(params);
  const shiftId = parseInt(shiftIdStr, 10);
  const router = useRouter();
  const permissions = usePermissions();

  const {
    shift,
    runs,
    outputs,
    vehicles,
    timelineEvents,
    metrics,
    status,
    progress,
    isLoading,
    refetch,
  } = useShiftDetail(date, shiftId);

  // Check if user can view production stats
  const canViewStats = permissions.canViewProductionStats();

  // Check if date is older than 10 days
  const isOldDate = useMemo(() => {
    const dateObj = parseISO(date);
    const daysDiff = differenceInDays(new Date(), dateObj);
    return daysDiff > 10;
  }, [date]);

  // If date is older than 10 days and user can't view stats, restrict access
  const isRestricted = isOldDate && !canViewStats;

  // Group outputs by product type for visualization
  const fishmealOutputs = outputs.filter(
    (o) =>
      o.product_type?.code?.toLowerCase().includes('meal') ||
      o.product_type?.name?.toLowerCase().includes('meal')
  );
  const fishOilOutputs = outputs.filter(
    (o) =>
      o.product_type?.code?.toLowerCase().includes('oil') ||
      o.product_type?.name?.toLowerCase().includes('oil')
  );

  // Calculate totals for visualizations
  const fishmealBags = fishmealOutputs.reduce(
    (sum, o) => sum + (o.package_count || 0),
    0
  );
  const fishmealWeight = fishmealOutputs.reduce(
    (sum, o) => sum + (o.total_quantity || 0),
    0
  );
  const avgWeightPerBag = fishmealBags > 0 ? fishmealWeight / fishmealBags : 0;

  const tankFills = fishOilOutputs.reduce(
    (sum, o) => sum + (o.fill_cycles || 0),
    0
  );
  const tankCapacity =
    fishOilOutputs.find((o) => o.tank_capacity)?.tank_capacity || 0;
  const fishOilTotal = fishOilOutputs.reduce(
    (sum, o) => sum + (o.total_quantity || 0),
    0
  );

  // Format date for display
  const displayDate = format(parseISO(date), 'EEE, d MMM yyyy');

  const handleAddOutput = () => {
    const params = new URLSearchParams();
    params.set('shift_id', shiftId.toString());
    params.set('production_date', date);
    router.push(`/production-outputs/new?${params.toString()}`);
  };

  return (
    <ProductionRunsGuard>
      <div className="from-muted/30 to-background min-h-screen bg-gradient-to-b pb-24">
        {/* Header */}
        <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 border-b backdrop-blur">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => router.back()}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold">
                  {shift?.name || 'Shift'} Details
                </h1>
                <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <Calendar className="size-3" />
                  {displayDate}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn('size-4', isLoading && 'animate-spin')}
              />
            </Button>
          </div>
        </div>

        <div className="container mx-auto space-y-6 p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-48 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </div>
          )}

          {/* Restricted Access - date is older than 10 days and user doesn't have permission */}
          {!isLoading && isRestricted && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-muted mb-4 rounded-full p-4">
                  <Lock className="text-muted-foreground size-8" />
                </div>
                <h3 className="mb-2 font-semibold">Data Restricted</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Historical data older than 10 days requires additional
                  permissions to view.
                </p>
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Content */}
          {!isLoading && shift && !isRestricted && (
            <>
              {/* Hero Section with Production Flow - hide stats if no permission */}
              <ShiftHero
                shift={shift}
                status={status}
                progress={progress}
                metrics={metrics}
                showStats={canViewStats}
              />

              {/* Timeline */}
              {timelineEvents.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <ShiftTimeline
                      shift={shift}
                      events={timelineEvents}
                      isActive={status === 'active'}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Output Visualizations - only show if user has permission */}
              {canViewStats && (fishmealBags > 0 || tankFills > 0) && (
                <div>
                  <h3 className="text-muted-foreground mb-3 px-1 text-xs font-semibold tracking-wide uppercase">
                    Production Outputs
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {fishmealBags > 0 && (
                      <BagStackVisual
                        packageType={fishmealOutputs[0]?.package_type?.name}
                        packageCount={fishmealBags}
                        weightPerPackage={avgWeightPerBag}
                        totalWeight={fishmealWeight}
                      />
                    )}
                    {tankFills > 0 && (
                      <TankFillGauge
                        tankCapacity={tankCapacity}
                        fillCycles={tankFills}
                        totalQuantity={fishOilTotal}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Empty output state with add button */}
              {outputs.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="bg-muted mb-4 rounded-full p-4">
                      <Plus className="text-muted-foreground size-8" />
                    </div>
                    <h3 className="mb-2 font-semibold">No Outputs Recorded</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Start recording production outputs for this shift
                    </p>
                    {permissions.canCreateProductionOutput() && (
                      <Button onClick={handleAddOutput}>
                        <Plus className="mr-2 size-4" />
                        Record Output
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Production Runs */}
              {runs.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-3 px-1 text-xs font-semibold tracking-wide uppercase">
                    Production Runs ({runs.length})
                  </h3>
                  <div className="space-y-3">
                    {runs.map((run) => (
                      <RunCardExpandable key={run.id} run={run} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty runs state */}
              {runs.length === 0 && (
                <Card className="bg-muted/30">
                  <CardContent className="text-muted-foreground p-6 text-center text-sm">
                    No production runs in this shift
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Summary - only show if user has permission */}
              {canViewStats && vehicles.length > 0 && (
                <div>
                  <h3 className="text-muted-foreground mb-3 px-1 text-xs font-semibold tracking-wide uppercase">
                    Vehicles Offloaded ({vehicles.length})
                  </h3>
                  <Card>
                    <CardContent className="divide-y p-0">
                      {vehicles.slice(0, 5).map((vehicle) => (
                        <div
                          key={vehicle.id}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">
                              {vehicle.vehicle_number}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {vehicle.supplier_name || 'Unknown supplier'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {Number(vehicle.weight_tons || 0).toFixed(1)}T
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {vehicle.offloading_completed_at
                                ? format(
                                    parseISO(vehicle.offloading_completed_at),
                                    'HH:mm'
                                  )
                                : '--'}
                            </p>
                          </div>
                        </div>
                      ))}
                      {vehicles.length > 5 && (
                        <div className="text-muted-foreground px-4 py-3 text-center text-sm">
                          + {vehicles.length - 5} more vehicle
                          {vehicles.length - 5 !== 1 ? 's' : ''}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Not found state */}
          {!isLoading && !shift && (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="mb-2 font-semibold">Shift Not Found</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  The requested shift could not be found
                </p>
                <Button variant="outline" onClick={() => router.back()}>
                  Go Back
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Floating Action Button */}
        {!isLoading &&
          shift &&
          status !== 'upcoming' &&
          permissions.canCreateProductionOutput() && (
            <div className="fixed right-6 bottom-6">
              <Button
                size="lg"
                className="h-14 w-14 rounded-full shadow-lg"
                onClick={handleAddOutput}
              >
                <Plus className="size-6" />
              </Button>
            </div>
          )}
      </div>
    </ProductionRunsGuard>
  );
}
