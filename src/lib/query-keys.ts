/**
 * React Query keys for consistent cache management
 * Centralized query key factory following best practices
 */

import type { FishPurchaseFilters } from "@/types/fish-purchase"
import type { BookingFilters } from "@/types/vehicle-booking"

export const fishPurchaseKeys = {
  all: ["fish-purchases"] as const,
  lists: () => [...fishPurchaseKeys.all, "list"] as const,
  list: (filters?: FishPurchaseFilters) =>
    [...fishPurchaseKeys.lists(), filters] as const,
  details: () => [...fishPurchaseKeys.all, "detail"] as const,
  detail: (id: number) => [...fishPurchaseKeys.details(), id] as const,
  species: () => [...fishPurchaseKeys.all, "species"] as const,
  suppliers: (options?: {
    limit?: number;
    search?: string;
    selectedSupplierId?: number;
  }) => [...fishPurchaseKeys.all, "suppliers", options] as const,
  locations: () => [...fishPurchaseKeys.all, "locations"] as const,
  banks: () => [...fishPurchaseKeys.all, "banks"] as const,
  agents: () => [...fishPurchaseKeys.all, "agents"] as const,
  settings: () => [...fishPurchaseKeys.all, "settings"] as const,
  formData: () => [...fishPurchaseKeys.all, "form-data"] as const,
  vehicleBooking: (id: number) =>
    [...fishPurchaseKeys.all, "vehicle-booking", id] as const,
}

export const vehicleBookingKeys = {
  all: ["vehicle-bookings"] as const,
  lists: () => [...vehicleBookingKeys.all, "list"] as const,
  list: (filters?: BookingFilters) =>
    [...vehicleBookingKeys.lists(), filters] as const,
  details: () => [...vehicleBookingKeys.all, "detail"] as const,
  detail: (id: number) => [...vehicleBookingKeys.details(), id] as const,
  activities: (id: number) => [...vehicleBookingKeys.detail(id), "activities"] as const,
  stats: (date?: string) => [...vehicleBookingKeys.all, "stats", date] as const,
  rangeStats: (dateFrom: string, dateTo: string) =>
    [...vehicleBookingKeys.all, "range-stats", dateFrom, dateTo] as const,
  dailyCapacity: (date?: string) =>
    [...vehicleBookingKeys.all, "daily-capacity", date] as const,
  settings: () => [...vehicleBookingKeys.all, "settings"] as const,
  suggestions: (query: string) =>
    [...vehicleBookingKeys.all, "suggestions", query] as const,
  quickPicks: () => [...vehicleBookingKeys.all, "quick-picks"] as const,
  billsGallery: (filters?: {
    search?: string;
    page?: number;
    file_type?: "all" | "images" | "pdfs";
    status?: string;
    date_from?: string;
    date_to?: string;
    entry_date_from?: string;
    entry_date_to?: string;
  }) => [...vehicleBookingKeys.all, "bills-gallery", filters] as const,
}

