import {formatInTimeZone, toZonedTime} from 'date-fns-tz';
import {subDays, format} from 'date-fns';
import type {ProductionShift} from '@/types/production-run';

// Default fallback timezone when not provided by backend
const DEFAULT_TIMEZONE = 'Asia/Muscat';

// Default production day start time - used when shifts not available
const DEFAULT_DAY_START = '07:15';

/**
 * Production day configuration
 * Can be obtained from backend via ShiftsResponse
 */
export interface ProductionDayConfig {
  timezone: string;
  shifts: ProductionShift[];
}

/**
 * Get the day shift start time from shifts data
 * Falls back to DEFAULT_DAY_START if not found
 */
export function getDayShiftStart(shifts: ProductionShift[]): string {
  // Find the day shift (typically has 'day' in code or name, or starts in morning)
  const dayShift = shifts.find(
    (s) =>
      s.code?.toLowerCase().includes('day') ||
      s.name?.toLowerCase().includes('day') ||
      (s.start_time >= '05:00' && s.start_time <= '09:00')
  );

  if (dayShift) {
    return dayShift.start_time.slice(0, 5);
  }

  return DEFAULT_DAY_START;
}

/**
 * Get current time in factory timezone
 * @param date - Date to convert (default: now)
 * @param timezone - Timezone from backend (default: Asia/Muscat)
 */
export function getFactoryTime(
  date: Date = new Date(),
  timezone: string = DEFAULT_TIMEZONE
): Date {
  return toZonedTime(date, timezone);
}

/**
 * Format date in factory timezone
 * @param date - Date to format
 * @param formatStr - date-fns format string
 * @param timezone - Timezone from backend (default: Asia/Muscat)
 */
export function formatFactoryTime(
  date: Date,
  formatStr: string,
  timezone: string = DEFAULT_TIMEZONE
): string {
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Get the Production Day for a given datetime
 *
 * Production Day runs from day shift start to day shift start next day
 * - 08:00 AM Jan 10 -> Production Day: Jan 10
 * - 02:00 AM Jan 11 -> Production Day: Jan 10 (still night shift)
 * - 07:30 AM Jan 11 -> Production Day: Jan 11
 *
 * @param datetime - The datetime to check
 * @param config - Configuration with shifts and timezone from backend
 */
export function getProductionDay(
  datetime: Date,
  config?: Partial<ProductionDayConfig>
): Date {
  const timezone = config?.timezone || DEFAULT_TIMEZONE;
  const factoryTime = getFactoryTime(datetime, timezone);
  const currentTime = formatFactoryTime(datetime, 'HH:mm', timezone);
  const dayStart = config?.shifts
    ? getDayShiftStart(config.shifts)
    : DEFAULT_DAY_START;

  // If before day shift start, it belongs to previous day's production
  if (currentTime < dayStart) {
    return subDays(factoryTime, 1);
  }

  return factoryTime;
}

/**
 * Get production day as formatted string (yyyy-MM-dd)
 */
export function getProductionDayString(
  datetime: Date,
  config?: Partial<ProductionDayConfig>
): string {
  const prodDay = getProductionDay(datetime, config);
  return format(prodDay, 'yyyy-MM-dd');
}

/**
 * Get display label for production day (dd MMM yyyy)
 */
export function getProductionDayLabel(
  datetime: Date,
  config?: Partial<ProductionDayConfig>
): string {
  const prodDay = getProductionDay(datetime, config);
  return format(prodDay, 'dd MMM yyyy');
}

/**
 * Determine which shift a datetime belongs to
 */
export function getShiftForTime(
  datetime: Date,
  shifts: ProductionShift[],
  timezone?: string
): ProductionShift | null {
  const tz = timezone || DEFAULT_TIMEZONE;
  const currentTime = formatFactoryTime(datetime, 'HH:mm', tz);

  return (
    shifts.find((shift) => {
      const start = shift.start_time.slice(0, 5);
      const end = shift.end_time.slice(0, 5);

      // Handle overnight shifts (Night: 19:15 - 07:15)
      if (start > end) {
        return currentTime >= start || currentTime < end;
      }
      // Day shift (07:15 - 19:15)
      return currentTime >= start && currentTime < end;
    }) || null
  );
}

/**
 * Get current shift based on factory time
 */
export function getCurrentShift(
  shifts: ProductionShift[],
  timezone?: string
): ProductionShift | null {
  return getShiftForTime(new Date(), shifts, timezone);
}

/**
 * Check if a shift is active right now
 */
export function isShiftActive(
  shift: ProductionShift,
  timezone?: string
): boolean {
  const tz = timezone || DEFAULT_TIMEZONE;
  const currentTime = formatFactoryTime(new Date(), 'HH:mm', tz);
  const start = shift.start_time.slice(0, 5);
  const end = shift.end_time.slice(0, 5);

  // Handle overnight shifts
  if (start > end) {
    return currentTime >= start || currentTime < end;
  }
  return currentTime >= start && currentTime < end;
}

/**
 * Format shift time range (removes seconds)
 * Input: "07:15:00" -> Output: "07:15"
 */
export function formatShiftTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Get shift time range display string
 * Example: "07:15 - 19:15"
 */
export function getShiftTimeRange(shift: ProductionShift): string {
  return `${formatShiftTime(shift.start_time)} - ${formatShiftTime(shift.end_time)}`;
}

/**
 * Group records by production day
 */
export function groupByProductionDay<T extends {created_at: string}>(
  records: T[],
  config?: Partial<ProductionDayConfig>
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const record of records) {
    const prodDay = getProductionDayString(new Date(record.created_at), config);
    const existing = groups.get(prodDay) || [];
    groups.set(prodDay, [...existing, record]);
  }

  return groups;
}

/**
 * Group records by production day AND shift
 */
export function groupByProductionDayAndShift<T extends {created_at: string}>(
  records: T[],
  config: ProductionDayConfig
): Map<string, Map<string, T[]>> {
  const dayGroups = new Map<string, Map<string, T[]>>();

  for (const record of records) {
    const datetime = new Date(record.created_at);
    const prodDay = getProductionDayString(datetime, config);
    const shift = getShiftForTime(datetime, config.shifts, config.timezone);
    const shiftKey = shift?.code || 'unknown';

    if (!dayGroups.has(prodDay)) {
      dayGroups.set(prodDay, new Map());
    }

    const shiftGroups = dayGroups.get(prodDay)!;
    const existing = shiftGroups.get(shiftKey) || [];
    shiftGroups.set(shiftKey, [...existing, record]);
  }

  return dayGroups;
}

/**
 * Get the datetime range for a production day
 * Returns start and end datetimes for API filtering
 * @param productionDate - Date string in yyyy-MM-dd format (production day)
 * @param config - Configuration with shifts and timezone
 */
export function getProductionDayRange(
  productionDate: string,
  config?: Partial<ProductionDayConfig>
): {start: Date; end: Date} {
  const dayStart = config?.shifts
    ? getDayShiftStart(config.shifts)
    : DEFAULT_DAY_START;

  // Production day starts at dayStart on the production date
  const start = new Date(`${productionDate}T${dayStart}:00`);

  // Production day ends at dayStart on the NEXT day
  const end = new Date(`${productionDate}T${dayStart}:00`);
  end.setDate(end.getDate() + 1);

  return {start, end};
}

/**
 * Check if a datetime falls within a production day
 * @param datetime - The datetime to check (or ISO string)
 * @param productionDate - Date string in yyyy-MM-dd format (production day)
 * @param config - Configuration with shifts and timezone
 */
export function isInProductionDay(
  datetime: Date | string,
  productionDate: string,
  config?: Partial<ProductionDayConfig>
): boolean {
  const dt = typeof datetime === 'string' ? new Date(datetime) : datetime;
  const {start, end} = getProductionDayRange(productionDate, config);
  return dt >= start && dt < end;
}

/**
 * Convert grouped map to array for easier rendering
 */
export interface ProductionDayGroup<T> {
  date: string;
  label: string;
  shifts: {
    shiftCode: string;
    shift: ProductionShift | null;
    records: T[];
  }[];
}

export function groupedMapToArray<T extends {created_at: string}>(
  groupedMap: Map<string, Map<string, T[]>>,
  shifts: ProductionShift[]
): ProductionDayGroup<T>[] {
  const result: ProductionDayGroup<T>[] = [];

  // Sort by date descending
  const sortedDates = Array.from(groupedMap.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  for (const date of sortedDates) {
    const shiftGroups = groupedMap.get(date)!;
    const shiftArray: ProductionDayGroup<T>['shifts'] = [];

    // Sort shifts: day first, then night
    const sortedShiftCodes = Array.from(shiftGroups.keys()).sort((a, b) => {
      const shiftA = shifts.find((s) => s.code === a);
      const shiftB = shifts.find((s) => s.code === b);
      if (!shiftA || !shiftB) return 0;
      // Day shift (starts earlier) comes first
      return shiftA.start_time.localeCompare(shiftB.start_time);
    });

    for (const shiftCode of sortedShiftCodes) {
      const records = shiftGroups.get(shiftCode) || [];
      const shift = shifts.find((s) => s.code === shiftCode) || null;
      shiftArray.push({shiftCode, shift, records});
    }

    result.push({
      date,
      label: format(new Date(date), 'dd MMM yyyy'),
      shifts: shiftArray,
    });
  }

  return result;
}
