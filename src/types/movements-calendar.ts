// Types for the Calendar-based Movements View

import type {InventoryMovement} from './inventory';

/**
 * View mode for calendar display
 */
export type CalendarViewMode = 'week' | 'month';

/**
 * Movement category for visual indicators
 */
export type MovementCategory = 'inbound' | 'outbound' | 'transfer';

/**
 * Day movement summary for calendar display
 */
export interface DayMovementSummary {
  date: string; // ISO date string (YYYY-MM-DD)
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string; // Mon, Tue, etc.
  dayNumber: number; // 1-31
  hasInbound: boolean;
  hasOutbound: boolean;
  hasTransfer: boolean;
  inboundTotal: number; // in kg
  outboundTotal: number; // in kg
  transferTotal: number; // in kg
  netMovement: number; // in kg (positive = net inbound)
  movementCount: number;
  isSelected?: boolean;
  isToday?: boolean;
  isCurrentMonth?: boolean;
}

/**
 * Week data structure
 */
export interface WeekData {
  startDate: Date;
  endDate: Date;
  days: DayMovementSummary[];
  formattedRange: string; // "Dec 23 - Dec 29, 2025"
}

/**
 * Month data structure
 */
export interface MonthData {
  year: number;
  month: number; // 0-11
  formattedMonth: string; // "December 2025"
  weeks: DayMovementSummary[][]; // Array of weeks, each with 7 days
}

/**
 * Period summary statistics
 */
export interface PeriodSummary {
  totalInbound: number;
  totalOutbound: number;
  totalTransfers: number;
  transferCount: number;
  netChange: number;
  movementCount: number;
}

/**
 * Warehouse activity for ranking
 */
export interface WarehouseActivity {
  id: number;
  name: string;
  totalMovements: number;
  inboundQuantity: number;
  outboundQuantity: number;
  activityPercentage: number; // 0-100 for progress bar
}

/**
 * Movement item for detailed list display
 */
export interface CalendarMovementItem {
  id: string;
  time: string; // "09:15 AM"
  category: MovementCategory;
  type: string; // "Inbound - Warehouse A", "Transfer: A → B"
  typeLabel: string; // "Inbound", "Outbound", "Transfer"
  quantity: number;
  productType: string;
  productTypeId: number;
  infoBadge?: string; // notes/reason field
  warehouseId: number;
  warehouseName: string;
  sourceWarehouseId?: number;
  sourceWarehouseName?: string;
  originalMovement: InventoryMovement;
}

/**
 * Calendar state returned by the hook
 */
export interface MovementsCalendarState {
  viewMode: CalendarViewMode;
  selectedDate: Date;
  weekData: WeekData | null;
  monthData: MonthData | null;
  selectedDayMovements: CalendarMovementItem[];
  periodSummary: PeriodSummary;
  warehouseActivities: WarehouseActivity[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Navigation functions for calendar
 */
export interface CalendarNavigation {
  goToPreviousPeriod: () => void;
  goToNextPeriod: () => void;
  goToToday: () => void;
  selectDay: (date: Date) => void;
}

/**
 * Helper function to get movement category from type
 */
export function getMovementCategory(type: string): MovementCategory {
  switch (type) {
    case 'production_output':
    case 'adjustment_add':
      return 'inbound';
    case 'adjustment_sub':
      return 'outbound';
    case 'transfer_in':
    case 'transfer_out':
      return 'transfer';
    default:
      return 'inbound';
  }
}

/**
 * Check if movement type is positive (adds to inventory)
 */
export function isPositiveMovement(type: string): boolean {
  return (
    type === 'production_output' ||
    type === 'adjustment_add' ||
    type === 'transfer_in'
  );
}
