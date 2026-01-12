'use client';

import {useState, useMemo} from 'react';
import {useRouter} from '@/i18n/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {format, addDays, subDays, parseISO} from 'date-fns';
import {cn} from '@/lib/utils';
import {
  getProductionDayString,
  formatFactoryTime,
  getShiftForTime,
  type ProductionDayConfig,
} from '@/lib/utils/production-day';
import {formatWeightTon} from '@/lib/utils/weight';
import {FlowVisualization} from './flow-visualization';
import {ShiftCard, ShiftEmpty} from './shift-card';
import {LiveIndicator} from './live-indicator';
import {
  useShifts,
  useProductionRuns,
  useProductionRun,
} from '@/hooks/use-production-runs';
import {useVehicleBookings} from '@/hooks/use-vehicle-bookings';
import {useProductionOutputs} from '@/hooks/use-production-outputs';
import type {
  ProductionShift,
  ProductionRunListItem,
} from '@/types/production-run';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface ProductionDayViewProps {
  /** Initial date to show (YYYY-MM-DD format). If not provided, defaults to current production day. */
  initialDate?: string;
  /** Callback when date changes via navigation or date picker */
  onDateChange?: (date: string) => void;
  onStartRun?: () => void;
  onRunClick?: (run: ProductionRunListItem) => void;
  /** Whether to show full stats (fish input, yield). If false, only shows outputs. */
  showStats?: boolean;
  className?: string;
}

export function ProductionDayView({
  initialDate,
  onDateChange,
  onStartRun,
  onRunClick,
  showStats = true,
  className,
}: ProductionDayViewProps) {
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

  // Fetch shifts data first to get timezone and shift times
  const {
    data: shiftsData,
    isLoading: shiftsLoading,
    isRefetching: shiftsRefetching,
    refetch: refetchShifts,
  } = useShifts();

  // Config for production day calculations
  const shifts = useMemo(() => shiftsData?.shifts || [], [shiftsData?.shifts]);
  const timezone = shiftsData?.timezone || 'Asia/Muscat';
  const currentShift = shiftsData?.current_shift || null;

  // Memoize config to avoid unnecessary re-renders
  const config: ProductionDayConfig = useMemo(
    () => ({timezone, shifts}),
    [timezone, shifts]
  );

  // Production day state - defaults to current PRODUCTION day (not calendar day)
  // Example: 7:14 AM on Jan 19 = Jan 18's production day (if shift starts at 7:15)
  // If initialDate is provided, use it; otherwise default to today's production day
  const [productionDay, setProductionDay] = useState<string>(() => {
    if (initialDate) return initialDate;
    return getProductionDayString(new Date(), {
      timezone: 'Asia/Muscat',
      shifts: [],
    });
  });

  // Current production day for comparison
  const currentProductionDay = getProductionDayString(new Date(), config);
  const isToday = productionDay === currentProductionDay;
  const currentTime = formatFactoryTime(new Date(), 'h:mm a', timezone);

  // Convert productionDay string to Date for display and date picker
  const selectedDate = useMemo(() => parseISO(productionDay), [productionDay]);

  // Fetch production runs for the selected production day
  const {
    data: runsData,
    isLoading: runsLoading,
    isRefetching: runsRefetching,
    refetch: refetchRuns,
  } = useProductionRuns({
    production_day: productionDay,
    per_page: 50,
  });

  // Fetch vehicle bookings for the production day
  // Backend handles shift-based filtering (07:15 to 07:15 next day)
  const {
    data: vehicleBookingsData,
    isLoading: vehicleBookingsLoading,
    isRefetching: vehicleBookingsRefetching,
    refetch: refetchVehicleBookings,
  } = useVehicleBookings({
    production_day: productionDay,
    per_page: 200,
  });

  // Fetch production outputs for the production day
  // Outputs are grouped by shift_id for display
  const {
    data: outputsData,
    isLoading: outputsLoading,
    isRefetching: outputsRefetching,
    refetch: refetchOutputs,
  } = useProductionOutputs({
    production_date: productionDay,
    per_page: 200,
  });

  // Fetch selected run details
  const {data: selectedRunData} = useProductionRun(selectedRunId);

  const isLoading =
    shiftsLoading || runsLoading || vehicleBookingsLoading || outputsLoading;
  const isRefetching =
    shiftsRefetching ||
    runsRefetching ||
    vehicleBookingsRefetching ||
    outputsRefetching;

  const refetch = () => {
    refetchShifts();
    refetchRuns();
    refetchVehicleBookings();
    refetchOutputs();
  };

  // Derived data
  const allRuns = useMemo(() => runsData?.data || [], [runsData?.data]);
  const vehicleBookings = useMemo(
    () => vehicleBookingsData?.data || [],
    [vehicleBookingsData?.data]
  );
  const outputs = useMemo(() => outputsData?.data || [], [outputsData?.data]);

  // Backend filters by production_day - frontend just displays
  const runs = allRuns;

  // Vehicles already filtered by backend for this production day
  // Backend returns only vehicles with offloading_completed_at within production day range
  const productionDayVehicles = useMemo(() => {
    return vehicleBookings.filter(
      (vehicle) => !!vehicle.offloading_completed_at
    );
  }, [vehicleBookings]);

  // Group runs, outputs, and vehicles by shift
  const shiftData = useMemo(() => {
    return shifts.map((shift) => {
      // Filter runs that belong to this shift
      // Use run.shift.id if available, otherwise fall back to time-based inference
      // TODO: Backend should ensure all runs have shift_id saved, then remove fallback
      const shiftRuns = runs.filter((run) => {
        if (run.shift?.id) {
          return run.shift.id === shift.id;
        }
        // Fallback: infer shift from started_at or created_at timestamp
        const runTime = run.started_at || run.created_at;
        if (!runTime) return false;
        const inferredShift = getShiftForTime(
          new Date(runTime),
          shifts,
          timezone
        );
        return inferredShift?.id === shift.id;
      });

      // Filter outputs by shift_id - outputs now have shift_id saved
      const shiftOutputs = outputs.filter(
        (output) => output.shift?.id === shift.id
      );

      // Filter vehicles that were offloaded during this shift
      // Vehicles don't have explicit shift_id, so we use offloading_completed_at time
      const shiftVehicles = productionDayVehicles.filter((vehicle) => {
        if (!vehicle.offloading_completed_at) return false;
        const vehicleShift = getShiftForTime(
          new Date(vehicle.offloading_completed_at),
          shifts,
          timezone
        );
        return vehicleShift?.id === shift.id;
      });

      // Calculate fish input from vehicle bookings
      // weight_tons is in TONS, convert to KG for FlowVisualization
      const fishInputKg = shiftVehicles.reduce(
        (sum, v) => sum + (v.weight_tons || 0) * 1000,
        0
      );

      // Calculate outputs from production outputs (directly, not from runs)
      const fishmealOutputKg = shiftOutputs
        .filter(
          (o) =>
            o.product_type?.code?.toLowerCase().includes('meal') ||
            o.product_type?.name?.toLowerCase().includes('meal')
        )
        .reduce((sum, o) => sum + (o.total_quantity || 0), 0);

      const fishOilOutputKg = shiftOutputs
        .filter(
          (o) =>
            o.product_type?.code?.toLowerCase().includes('oil') ||
            o.product_type?.name?.toLowerCase().includes('oil')
        )
        .reduce((sum, o) => sum + (o.total_quantity || 0), 0);

      return {
        shift,
        runs: shiftRuns,
        metrics: {
          fishInputKg,
          fishmealOutputKg,
          fishOilOutputKg,
          vehicleCount: shiftVehicles.length,
        },
      };
    });
  }, [shifts, runs, outputs, productionDayVehicles, timezone]);

  // Calculate day totals
  const dayTotals = useMemo(() => {
    return shiftData.reduce(
      (acc, sd) => ({
        fishInputKg: acc.fishInputKg + sd.metrics.fishInputKg,
        fishmealOutputKg: acc.fishmealOutputKg + sd.metrics.fishmealOutputKg,
        fishOilOutputKg: acc.fishOilOutputKg + sd.metrics.fishOilOutputKg,
        vehicleCount: acc.vehicleCount + sd.metrics.vehicleCount,
      }),
      {fishInputKg: 0, fishmealOutputKg: 0, fishOilOutputKg: 0, vehicleCount: 0}
    );
  }, [shiftData]);

  // Total runs
  const totalRuns = runs.length;
  const activeRuns = runs.filter((r) => r.status === 'in_progress').length;

  // Navigation handlers - navigate by production day
  const handlePrevDay = () => {
    const newDate = format(subDays(parseISO(productionDay), 1), 'yyyy-MM-dd');
    setProductionDay(newDate);
    setSelectedRunId(null);
    onDateChange?.(newDate);
  };

  const handleNextDay = () => {
    const newDate = format(addDays(parseISO(productionDay), 1), 'yyyy-MM-dd');
    setProductionDay(newDate);
    setSelectedRunId(null);
    onDateChange?.(newDate);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const newDate = format(date, 'yyyy-MM-dd');
      setProductionDay(newDate);
      setSelectedRunId(null);
      onDateChange?.(newDate);
    }
    setShowDatePicker(false);
  };

  const handleGoToToday = () => {
    setProductionDay(currentProductionDay);
    setShowDatePicker(false);
    onDateChange?.(currentProductionDay);
  };

  // Shift status helper
  const getShiftStatus = (
    shift: ProductionShift
  ): 'active' | 'upcoming' | 'completed' => {
    if (!isToday) return 'completed';
    if (currentShift?.id === shift.id) return 'active';

    const shiftStart = shift.start_time.slice(0, 5);
    const currentShiftStart = currentShift?.start_time.slice(0, 5) || '00:00';

    if (shiftStart > currentShiftStart) {
      return 'upcoming';
    }
    return 'completed';
  };

  // Handle run selection
  const handleRunClick = (run: ProductionRunListItem) => {
    setSelectedRunId(run.id);
    onRunClick?.(run);
  };

  // Handle add output for a specific shift
  const handleAddOutput = (shift: ProductionShift) => {
    // Navigate to production output form with shift and date pre-selected
    const params = new URLSearchParams();
    params.set('shift_id', shift.id.toString());
    params.set('production_date', productionDay);
    router.push(`/production-outputs/new?${params.toString()}`);
  };

  // Handle shift click to navigate to detail page
  const handleShiftClick = (shiftId: number) => {
    router.push(`/production-hub/shifts/${productionDay}/${shiftId}`);
  };

  // Format date for display
  const displayDate = selectedDate.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Date Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevDay}
          className="shrink-0"
        >
          <ChevronLeft className="size-5" />
        </Button>

        <button
          onClick={() => setShowDatePicker(true)}
          className="hover:bg-muted flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        >
          <Calendar className="text-muted-foreground size-4" />
          <span className="font-semibold">{displayDate}</span>
          {isToday && <LiveIndicator size="sm" variant="dot" />}
        </button>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextDay}
            className="shrink-0"
          >
            <ChevronRight className="size-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="shrink-0"
          >
            <RefreshCw
              className={cn('size-4', isRefetching && 'animate-spin')}
            />
          </Button>
        </div>
      </div>

      {/* Date Picker Modal */}
      <Sheet open={showDatePicker} onOpenChange={setShowDatePicker}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Select Production Day</SheetTitle>
          </SheetHeader>
          <div className="flex justify-center py-4">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              inline
              calendarClassName="!border-0"
            />
          </div>
          <div className="flex gap-2 pb-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDatePicker(false)}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="bg-muted h-40 animate-pulse rounded-xl" />
          <div className="bg-muted h-64 animate-pulse rounded-xl" />
          <div className="bg-muted h-32 animate-pulse rounded-xl" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <>
          {/* Day Summary Card */}
          {(totalRuns > 0 || dayTotals.fishInputKg > 0) && (
            <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white dark:from-slate-800 dark:to-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Daily Production
                </span>
                {isToday && activeRuns > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    {activeRuns} Active
                  </span>
                )}
              </div>

              <FlowVisualization
                fishInputKg={dayTotals.fishInputKg}
                vehicleCount={dayTotals.vehicleCount}
                fishmealOutputKg={dayTotals.fishmealOutputKg}
                fishOilOutputKg={dayTotals.fishOilOutputKg}
                showInput={showStats}
                showYield={showStats}
                className="[&_*]:text-white [&_.text-muted-foreground]:text-slate-400"
              />

              <div className="mt-3 flex items-center justify-between border-t border-slate-700 pt-3 text-sm">
                <span className="text-slate-400">
                  {totalRuns} Production Run{totalRuns !== 1 ? 's' : ''}
                </span>
                <span className="text-slate-400">
                  {shifts.length} Shift{shifts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Shift Cards */}
          <div className="space-y-4">
            {shiftData.map((sd) => {
              const status = getShiftStatus(sd.shift);
              const hasActivity =
                sd.runs.length > 0 || sd.metrics.fishInputKg > 0;

              if (!hasActivity && status === 'upcoming') {
                return (
                  <ShiftEmpty
                    key={sd.shift.id}
                    shift={sd.shift}
                    status="upcoming"
                    onStartRun={undefined}
                  />
                );
              }

              if (!hasActivity && status !== 'active') {
                return (
                  <ShiftCard
                    key={sd.shift.id}
                    shift={sd.shift}
                    runs={sd.runs}
                    metrics={sd.metrics}
                    status={status}
                    variant="mini"
                    showStats={showStats}
                    onAddOutput={() => handleAddOutput(sd.shift)}
                    onShiftClick={
                      showStats
                        ? () => handleShiftClick(sd.shift.id)
                        : undefined
                    }
                  />
                );
              }

              return (
                <ShiftCard
                  key={sd.shift.id}
                  shift={sd.shift}
                  runs={sd.runs}
                  metrics={sd.metrics}
                  status={status}
                  currentTime={isToday ? currentTime : undefined}
                  onRunClick={handleRunClick}
                  onAddOutput={() => handleAddOutput(sd.shift)}
                  onShiftClick={
                    showStats ? () => handleShiftClick(sd.shift.id) : undefined
                  }
                  showStats={showStats}
                  variant={status === 'active' ? 'full' : 'compact'}
                />
              );
            })}

            {/* Empty State */}
            {shiftData.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No production data for this day
                  </p>
                  {isToday && onStartRun && (
                    <Button onClick={onStartRun}>+ Start Production Run</Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Selected Run Detail Sheet */}
      <Sheet
        open={!!selectedRunId}
        onOpenChange={(open) => !open && setSelectedRunId(null)}
      >
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedRunId(null)}
              >
                <ArrowLeft className="size-5" />
              </Button>
              <SheetTitle>
                {selectedRunData?.run?.name || 'Production Run'}
              </SheetTitle>
            </div>
          </SheetHeader>

          {selectedRunData?.run && (
            <div className="space-y-4 overflow-auto py-4">
              {/* Run Status */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    selectedRunData.run.status === 'in_progress' &&
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    selectedRunData.run.status === 'completed' &&
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                    selectedRunData.run.status === 'planned' &&
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  )}
                >
                  {selectedRunData.run.status.replace('_', ' ')}
                </span>
                {selectedRunData.run.operator && (
                  <span className="text-muted-foreground text-sm">
                    by {selectedRunData.run.operator.name}
                  </span>
                )}
              </div>

              {/* Run Metrics */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                    Run Output
                  </h4>
                  <FlowVisualization
                    fishInputKg={selectedRunData.run.total_planned * 1000}
                    fishmealOutputKg={selectedRunData.run.total_actual * 1000}
                    fishOilOutputKg={0}
                    variant="compact"
                  />
                </CardContent>
              </Card>

              {/* Production Lines */}
              {selectedRunData.run.production_lines.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                      Production Lines
                    </h4>
                    <div className="space-y-2">
                      {selectedRunData.run.production_lines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{line.name || `Line ${line.id}`}</span>
                          <span className="font-medium">
                            {formatWeightTon(line.actual_production)} /{' '}
                            {formatWeightTon(line.planned_capacity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Times */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-muted-foreground mb-3 text-sm font-medium">
                    Timeline
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>
                        {new Date(
                          selectedRunData.run.created_at
                        ).toLocaleString()}
                      </span>
                    </div>
                    {selectedRunData.run.started_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span>
                          {new Date(
                            selectedRunData.run.started_at
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {selectedRunData.run.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span>
                          {new Date(
                            selectedRunData.run.completed_at
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
