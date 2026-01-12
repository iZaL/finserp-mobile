/**
 * React Query keys for consistent cache management
 * Centralized query key factory following best practices
 */

import type {BatchFilters} from '@/types/batch';
import type {FishPurchaseFilters} from '@/types/fish-purchase';
import type {MovementFilters} from '@/types/inventory';
import type {ProductionOutputFilters} from '@/types/production-output';
import type {BookingFilters} from '@/types/vehicle-booking';

export const fishPurchaseKeys = {
  all: ['fish-purchases'] as const,
  lists: () => [...fishPurchaseKeys.all, 'list'] as const,
  list: (filters?: FishPurchaseFilters) =>
    [...fishPurchaseKeys.lists(), filters] as const,
  details: () => [...fishPurchaseKeys.all, 'detail'] as const,
  detail: (id: number) => [...fishPurchaseKeys.details(), id] as const,
  species: () => [...fishPurchaseKeys.all, 'species'] as const,
  suppliers: (options?: {
    limit?: number;
    search?: string;
    selectedSupplierId?: number;
  }) => [...fishPurchaseKeys.all, 'suppliers', options] as const,
  locations: () => [...fishPurchaseKeys.all, 'locations'] as const,
  banks: () => [...fishPurchaseKeys.all, 'banks'] as const,
  agents: () => [...fishPurchaseKeys.all, 'agents'] as const,
  settings: () => [...fishPurchaseKeys.all, 'settings'] as const,
  formData: () => [...fishPurchaseKeys.all, 'form-data'] as const,
  vehicleBooking: (id: number) =>
    [...fishPurchaseKeys.all, 'vehicle-booking', id] as const,
};

export const vehicleBookingKeys = {
  all: ['vehicle-bookings'] as const,
  lists: () => [...vehicleBookingKeys.all, 'list'] as const,
  list: (filters?: BookingFilters) =>
    [...vehicleBookingKeys.lists(), filters] as const,
  details: () => [...vehicleBookingKeys.all, 'detail'] as const,
  detail: (id: number) => [...vehicleBookingKeys.details(), id] as const,
  activities: (id: number) =>
    [...vehicleBookingKeys.detail(id), 'activities'] as const,
  stats: (date?: string) => [...vehicleBookingKeys.all, 'stats', date] as const,
  rangeStats: (dateFrom: string, dateTo: string) =>
    [...vehicleBookingKeys.all, 'range-stats', dateFrom, dateTo] as const,
  dailyCapacity: (date?: string) =>
    [...vehicleBookingKeys.all, 'daily-capacity', date] as const,
  settings: () => [...vehicleBookingKeys.all, 'settings'] as const,
  suggestions: (query: string) =>
    [...vehicleBookingKeys.all, 'suggestions', query] as const,
  quickPicks: () => [...vehicleBookingKeys.all, 'quick-picks'] as const,
  billsGallery: (filters?: {
    search?: string;
    page?: number;
    file_type?: 'all' | 'images' | 'pdfs';
    status?: string;
    date_from?: string;
    date_to?: string;
    entry_date_from?: string;
    entry_date_to?: string;
  }) => [...vehicleBookingKeys.all, 'bills-gallery', filters] as const,
};

export const productionOutputKeys = {
  all: ['production-outputs'] as const,
  lists: () => [...productionOutputKeys.all, 'list'] as const,
  list: (filters?: ProductionOutputFilters) =>
    [...productionOutputKeys.lists(), filters] as const,
  details: () => [...productionOutputKeys.all, 'detail'] as const,
  detail: (id: number) => [...productionOutputKeys.details(), id] as const,
  formData: () => [...productionOutputKeys.all, 'form-data'] as const,
};

export const productionRunKeys = {
  all: ['production-runs'] as const,
  lists: () => [...productionRunKeys.all, 'list'] as const,
  list: (filters?: {status?: string; per_page?: number; page?: number}) =>
    [...productionRunKeys.lists(), filters] as const,
  details: () => [...productionRunKeys.all, 'detail'] as const,
  detail: (id: number) => [...productionRunKeys.details(), id] as const,
  dashboard: () => [...productionRunKeys.all, 'dashboard'] as const,
  /** Production hub with aggregated metrics by shift */
  hub: (productionDay?: string) =>
    [...productionRunKeys.all, 'hub', productionDay] as const,
  shifts: () => [...productionRunKeys.all, 'shifts'] as const,
  operators: (search?: string) =>
    [...productionRunKeys.all, 'operators', search] as const,
  productionLines: () =>
    [...productionRunKeys.all, 'production-lines'] as const,
  handovers: () => [...productionRunKeys.all, 'handovers'] as const,
  handover: (id: number) => [...productionRunKeys.handovers(), id] as const,
  handoverFormData: () =>
    [...productionRunKeys.all, 'handover-form-data'] as const,
  runFormData: () => [...productionRunKeys.all, 'run-form-data'] as const,
};

export const inventoryKeys = {
  all: ['inventory'] as const,
  stock: () => [...inventoryKeys.all, 'stock'] as const,
  stockByType: () => [...inventoryKeys.stock(), 'by-type'] as const,
  movements: () => [...inventoryKeys.all, 'movements'] as const,
  movementsList: (filters?: MovementFilters) =>
    [...inventoryKeys.movements(), 'list', filters] as const,
  formData: () => [...inventoryKeys.all, 'form-data'] as const,
};

export const batchKeys = {
  all: ['batches'] as const,
  lists: () => [...batchKeys.all, 'list'] as const,
  list: (filters?: BatchFilters) => [...batchKeys.lists(), filters] as const,
  details: () => [...batchKeys.all, 'detail'] as const,
  detail: (id: number) => [...batchKeys.details(), id] as const,
  formData: () => [...batchKeys.all, 'form-data'] as const,
};

// Batch Inventory Keys - for batch-level inventory management
export const batchInventoryKeys = {
  all: ['batch-inventory'] as const,
  batches: (filters?: {
    warehouse_id?: number;
    product_type_id?: number;
    search?: string;
  }) => [...batchInventoryKeys.all, 'batches', filters] as const,
  batch: (id: number) => [...batchInventoryKeys.all, 'batch', id] as const,
  movements: (filters?: {
    warehouse_id?: number;
    from_date?: string;
    to_date?: string;
    page?: number;
    per_page?: number;
  }) => [...batchInventoryKeys.all, 'movements', filters] as const,
  warehouses: () => [...batchInventoryKeys.all, 'warehouses'] as const,
  reasons: () => [...batchInventoryKeys.all, 'reasons'] as const,
};
