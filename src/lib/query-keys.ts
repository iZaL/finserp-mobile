/**
 * React Query keys for fish purchase queries
 * Centralized query key factory for consistent cache management
 */

import type { FishPurchaseFilters } from "@/types/fish-purchase"

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
  vehicleBooking: (id: number) =>
    [...fishPurchaseKeys.all, "vehicle-booking", id] as const,
}

