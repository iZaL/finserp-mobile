'use client';

import {useState, useMemo, useCallback} from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  isSameMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  parseISO,
  getDay,
  getDate,
} from 'date-fns';
import {useInventoryMovements} from './use-inventory';
import type {InventoryMovement} from '@/types/inventory';
import type {
  CalendarViewMode,
  DayMovementSummary,
  WeekData,
  MonthData,
  PeriodSummary,
  WarehouseActivity,
  CalendarMovementItem,
  CalendarNavigation,
} from '@/types/movements-calendar';
import {
  getMovementCategory,
  isPositiveMovement,
} from '@/types/movements-calendar';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Transform raw movement to calendar movement item
 */
function transformMovement(movement: InventoryMovement): CalendarMovementItem {
  const category = getMovementCategory(movement.type);
  const createdAt = parseISO(movement.created_at);
  const time = format(createdAt, 'hh:mm a');

  let type = '';
  let typeLabel = '';

  switch (movement.type) {
    case 'production_output':
      type = `Production - ${movement.warehouse.name}`;
      typeLabel = 'Production';
      break;
    case 'adjustment_add':
      type = `Inbound - ${movement.warehouse.name}`;
      typeLabel = 'Inbound';
      break;
    case 'adjustment_sub':
      type = `Outbound - ${movement.warehouse.name}`;
      typeLabel = 'Outbound';
      break;
    case 'transfer_in':
      type = movement.source_warehouse
        ? `Transfer: ${movement.source_warehouse.name} → ${movement.warehouse.name}`
        : `Transfer In - ${movement.warehouse.name}`;
      typeLabel = 'Transfer In';
      break;
    case 'transfer_out':
      type = `Transfer Out - ${movement.warehouse.name}`;
      typeLabel = 'Transfer Out';
      break;
    default:
      type = movement.warehouse.name;
      typeLabel = 'Movement';
  }

  return {
    id: String(movement.id),
    time,
    category,
    type,
    typeLabel,
    quantity: movement.quantity,
    productType: movement.product_type.name,
    productTypeId: movement.product_type.id,
    infoBadge: movement.notes || movement.reason || undefined,
    warehouseId: movement.warehouse.id,
    warehouseName: movement.warehouse.name,
    sourceWarehouseId: movement.source_warehouse?.id,
    sourceWarehouseName: movement.source_warehouse?.name,
    originalMovement: movement,
  };
}

/**
 * Group movements by date string (YYYY-MM-DD)
 */
function groupMovementsByDate(
  movements: InventoryMovement[]
): Map<string, InventoryMovement[]> {
  const grouped = new Map<string, InventoryMovement[]>();

  movements.forEach((movement) => {
    const dateStr = format(parseISO(movement.created_at), 'yyyy-MM-dd');
    const existing = grouped.get(dateStr) || [];
    grouped.set(dateStr, [...existing, movement]);
  });

  return grouped;
}

/**
 * Calculate day summary from movements
 */
function calculateDaySummary(
  date: Date,
  movements: InventoryMovement[],
  selectedDate: Date,
  currentMonth?: Date
): DayMovementSummary {
  let inboundTotal = 0;
  let outboundTotal = 0;
  let transferTotal = 0;
  let hasInbound = false;
  let hasOutbound = false;
  let hasTransfer = false;

  movements.forEach((m) => {
    const category = getMovementCategory(m.type);
    const isPositive = isPositiveMovement(m.type);

    if (category === 'inbound') {
      hasInbound = true;
      inboundTotal += m.quantity;
    } else if (category === 'outbound') {
      hasOutbound = true;
      outboundTotal += m.quantity;
    } else if (category === 'transfer') {
      hasTransfer = true;
      // For transfers, count the quantity but don't add to in/out totals
      // as transfers are internal movements
      if (isPositive) {
        transferTotal += m.quantity;
      }
    }
  });

  // Net = inbound - outbound (transfers are neutral)
  const netMovement = inboundTotal - outboundTotal;

  return {
    date: format(date, 'yyyy-MM-dd'),
    dayOfWeek: getDay(date),
    dayName: DAY_NAMES[getDay(date)],
    dayNumber: getDate(date),
    hasInbound,
    hasOutbound,
    hasTransfer,
    inboundTotal,
    outboundTotal,
    transferTotal,
    netMovement,
    movementCount: movements.length,
    isSelected: isSameDay(date, selectedDate),
    isToday: isToday(date),
    isCurrentMonth: currentMonth ? isSameMonth(date, currentMonth) : true,
  };
}

/**
 * Calculate period summary
 */
function calculatePeriodSummary(movements: InventoryMovement[]): PeriodSummary {
  let totalInbound = 0;
  let totalOutbound = 0;
  let totalTransfers = 0;
  let transferCount = 0;

  movements.forEach((m) => {
    const category = getMovementCategory(m.type);

    if (category === 'inbound') {
      totalInbound += m.quantity;
    } else if (category === 'outbound') {
      totalOutbound += m.quantity;
    } else if (category === 'transfer') {
      if (m.type === 'transfer_in') {
        totalTransfers += m.quantity;
        transferCount++;
      }
    }
  });

  return {
    totalInbound,
    totalOutbound,
    totalTransfers,
    transferCount,
    netChange: totalInbound - totalOutbound,
    movementCount: movements.length,
  };
}

/**
 * Calculate warehouse activities
 */
function calculateWarehouseActivities(
  movements: InventoryMovement[]
): WarehouseActivity[] {
  const warehouseMap = new Map<
    number,
    {id: number; name: string; count: number; inbound: number; outbound: number}
  >();

  movements.forEach((m) => {
    const existing = warehouseMap.get(m.warehouse.id) || {
      id: m.warehouse.id,
      name: m.warehouse.name,
      count: 0,
      inbound: 0,
      outbound: 0,
    };

    existing.count++;
    if (isPositiveMovement(m.type)) {
      existing.inbound += m.quantity;
    } else {
      existing.outbound += m.quantity;
    }

    warehouseMap.set(m.warehouse.id, existing);
  });

  const activities = Array.from(warehouseMap.values())
    .map((w) => ({
      id: w.id,
      name: w.name,
      totalMovements: w.count,
      inboundQuantity: w.inbound,
      outboundQuantity: w.outbound,
      activityPercentage: 0,
    }))
    .sort((a, b) => b.totalMovements - a.totalMovements);

  // Calculate percentage based on max movements
  const maxMovements = activities[0]?.totalMovements || 1;
  activities.forEach((a) => {
    a.activityPercentage = Math.round((a.totalMovements / maxMovements) * 100);
  });

  return activities.slice(0, 5); // Top 5 warehouses
}

/**
 * Main hook for movements calendar
 */
export function useMovementsCalendar() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'week') {
      return {
        startDate: startOfWeek(selectedDate, {weekStartsOn: 0}),
        endDate: endOfWeek(selectedDate, {weekStartsOn: 0}),
      };
    }
    // For month view, we need to include days from adjacent months that appear in the calendar
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    return {
      startDate: startOfWeek(monthStart, {weekStartsOn: 0}),
      endDate: endOfWeek(monthEnd, {weekStartsOn: 0}),
    };
  }, [viewMode, selectedDate]);

  // Fetch movements for the date range
  const {
    data: movementsData,
    isLoading,
    error,
  } = useInventoryMovements({
    date_from: format(dateRange.startDate, 'yyyy-MM-dd'),
    date_to: format(dateRange.endDate, 'yyyy-MM-dd'),
    per_page: 500,
  });

  const movements = movementsData?.data || [];

  // Group movements by date
  const movementsByDate = useMemo(() => {
    return groupMovementsByDate(movements);
  }, [movements]);

  // Build week data
  const weekData = useMemo((): WeekData | null => {
    if (viewMode !== 'week') return null;

    const days = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    });

    const daySummaries = days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayMovements = movementsByDate.get(dateStr) || [];
      return calculateDaySummary(date, dayMovements, selectedDate);
    });

    const startMonth = format(dateRange.startDate, 'MMM');
    const endMonth = format(dateRange.endDate, 'MMM');
    const startDay = format(dateRange.startDate, 'd');
    const endDay = format(dateRange.endDate, 'd');
    const year = format(dateRange.endDate, 'yyyy');

    const formattedRange =
      startMonth === endMonth
        ? `${startMonth} ${startDay} - ${endDay}, ${year}`
        : `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;

    return {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      days: daySummaries,
      formattedRange,
    };
  }, [viewMode, dateRange, movementsByDate, selectedDate]);

  // Build month data
  const monthData = useMemo((): MonthData | null => {
    if (viewMode !== 'month') return null;

    const currentMonth = startOfMonth(selectedDate);
    const days = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    });

    const daySummaries = days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayMovements = movementsByDate.get(dateStr) || [];
      return calculateDaySummary(
        date,
        dayMovements,
        selectedDate,
        currentMonth
      );
    });

    // Group into weeks (7 days each)
    const weeks: DayMovementSummary[][] = [];
    for (let i = 0; i < daySummaries.length; i += 7) {
      weeks.push(daySummaries.slice(i, i + 7));
    }

    return {
      year: selectedDate.getFullYear(),
      month: selectedDate.getMonth(),
      formattedMonth: format(selectedDate, 'MMMM yyyy'),
      weeks,
    };
  }, [viewMode, dateRange, movementsByDate, selectedDate]);

  // Get movements for selected day
  const selectedDayMovements = useMemo((): CalendarMovementItem[] => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayMovements = movementsByDate.get(dateStr) || [];
    return dayMovements.map(transformMovement).sort((a, b) => {
      // Sort by time descending (most recent first)
      return b.time.localeCompare(a.time);
    });
  }, [selectedDate, movementsByDate]);

  // Calculate period summary
  const periodSummary = useMemo((): PeriodSummary => {
    if (viewMode === 'week') {
      // Summary for the week
      return calculatePeriodSummary(movements);
    }
    // For month view, only include movements from the current month
    const currentMonth = startOfMonth(selectedDate);
    const monthMovements = movements.filter((m) => {
      const moveDate = parseISO(m.created_at);
      return isSameMonth(moveDate, currentMonth);
    });
    return calculatePeriodSummary(monthMovements);
  }, [movements, viewMode, selectedDate]);

  // Calculate warehouse activities (for monthly view)
  const warehouseActivities = useMemo((): WarehouseActivity[] => {
    if (viewMode !== 'month') return [];
    const currentMonth = startOfMonth(selectedDate);
    const monthMovements = movements.filter((m) => {
      const moveDate = parseISO(m.created_at);
      return isSameMonth(moveDate, currentMonth);
    });
    return calculateWarehouseActivities(monthMovements);
  }, [movements, viewMode, selectedDate]);

  // Navigation functions
  const goToPreviousPeriod = useCallback(() => {
    setSelectedDate((prev) =>
      viewMode === 'week' ? subWeeks(prev, 1) : subMonths(prev, 1)
    );
  }, [viewMode]);

  const goToNextPeriod = useCallback(() => {
    setSelectedDate((prev) =>
      viewMode === 'week' ? addWeeks(prev, 1) : addMonths(prev, 1)
    );
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const selectDay = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  const navigation: CalendarNavigation = {
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
    selectDay,
  };

  // Selected day summary for the summary card
  const selectedDaySummary = useMemo((): DayMovementSummary | null => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayMovements = movementsByDate.get(dateStr) || [];
    return calculateDaySummary(
      dayMovements.length > 0 ? selectedDate : selectedDate,
      dayMovements,
      selectedDate
    );
  }, [selectedDate, movementsByDate]);

  return {
    // State
    viewMode,
    setViewMode,
    selectedDate,

    // Data
    weekData,
    monthData,
    selectedDayMovements,
    selectedDaySummary,
    periodSummary,
    warehouseActivities,

    // Loading state
    isLoading,
    error,

    // Navigation
    navigation,
  };
}
