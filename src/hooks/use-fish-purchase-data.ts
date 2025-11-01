import { useState, useEffect, useCallback } from "react";
import { fishPurchaseService } from "@/lib/services/fish-purchase";
import type {
  FishSpecies,
  FishPurchaseSettings,
} from "@/types/fish-purchase";
import type { Contact, Address, Bank } from "@/types/shared";
import { toast } from "sonner";

/**
 * Hook to fetch fish species list
 * Caches data to avoid unnecessary refetches
 */
export function useFishSpecies() {
  const [data, setData] = useState<FishSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSpecies = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getFishSpecies({ signal });
      setData(result);

      // Cache in localStorage for offline support
      if (typeof window !== "undefined") {
        localStorage.setItem("fish_species", JSON.stringify(result));
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);

        // Try to load from cache on error
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("fish_species");
          if (cached) {
            setData(JSON.parse(cached));
            toast.warning("Showing cached fish species data");
          } else {
            toast.error("Failed to fetch fish species");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Try to load from cache immediately for better UX
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("fish_species");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    }

    // Then fetch fresh data
    fetchSpecies(controller.signal);

    return () => controller.abort();
  }, [fetchSpecies]);

  const refresh = () => fetchSpecies();

  return { data, loading, error, refresh };
}

/**
 * Hook to fetch suppliers (fish suppliers with bank details)
 */
export function useSuppliers() {
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSuppliers = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getSuppliers({ signal });
      setData(result);

      // Cache in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("fish_suppliers", JSON.stringify(result));
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);

        // Try to load from cache on error
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("fish_suppliers");
          if (cached) {
            setData(JSON.parse(cached));
            toast.warning("Showing cached suppliers data");
          } else {
            toast.error("Failed to fetch suppliers");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Load from cache immediately
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("fish_suppliers");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    }

    fetchSuppliers(controller.signal);

    return () => controller.abort();
  }, [fetchSuppliers]);

  const refresh = () => fetchSuppliers();

  return { data, loading, error, refresh };
}

/**
 * Hook to fetch fish landing sites (locations)
 */
export function useLocations() {
  const [data, setData] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocations = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getLocations({ signal });
      setData(result);

      // Cache in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("fish_locations", JSON.stringify(result));
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);

        // Try to load from cache on error
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("fish_locations");
          if (cached) {
            setData(JSON.parse(cached));
            toast.warning("Showing cached locations data");
          } else {
            toast.error("Failed to fetch locations");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Load from cache immediately
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("fish_locations");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    }

    fetchLocations(controller.signal);

    return () => controller.abort();
  }, [fetchLocations]);

  const refresh = () => fetchLocations();

  return { data, loading, error, refresh };
}

/**
 * Hook to fetch banks list
 */
export function useBanks() {
  const [data, setData] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBanks = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getBanks({ signal });
      setData(result);

      // Cache in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("fish_banks", JSON.stringify(result));
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);

        // Try to load from cache on error
        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("fish_banks");
          if (cached) {
            setData(JSON.parse(cached));
            toast.warning("Showing cached banks data");
          } else {
            toast.error("Failed to fetch banks");
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    // Load from cache immediately
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("fish_banks");
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }
    }

    fetchBanks(controller.signal);

    return () => controller.abort();
  }, [fetchBanks]);

  const refresh = () => fetchBanks();

  return { data, loading, error, refresh };
}

/**
 * Hook to fetch agents list
 */
export function useAgents() {
  const [data, setData] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgents = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getAgents({ signal });
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
        toast.error("Failed to fetch agents");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAgents(controller.signal);
    return () => controller.abort();
  }, [fetchAgents]);

  const refresh = () => fetchAgents();

  return { data, loading, error, refresh };
}

/**
 * Hook to fetch fish purchase settings (bill number, defaults)
 */
export function useFishPurchaseSettings() {
  const [data, setData] = useState<FishPurchaseSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getSettings({ signal });
      setData(result);
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err);
        toast.error("Failed to fetch settings");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSettings(controller.signal);
    return () => controller.abort();
  }, [fetchSettings]);

  const refresh = () => fetchSettings();

  return { data, loading, error, refresh };
}

/**
 * Combined hook to fetch all required data for fish purchase form
 * Use this in the create/edit form pages for convenience
 */
export function useFishPurchaseFormData() {
  const fishSpecies = useFishSpecies();
  const suppliers = useSuppliers();
  const locations = useLocations();
  const banks = useBanks();
  const agents = useAgents();
  const settings = useFishPurchaseSettings();

  const loading =
    fishSpecies.loading ||
    suppliers.loading ||
    locations.loading ||
    banks.loading ||
    agents.loading ||
    settings.loading;

  const error =
    fishSpecies.error ||
    suppliers.error ||
    locations.error ||
    banks.error ||
    agents.error ||
    settings.error;

  const refresh = () => {
    fishSpecies.refresh();
    suppliers.refresh();
    locations.refresh();
    banks.refresh();
    agents.refresh();
    settings.refresh();
  };

  return {
    fishSpecies: fishSpecies.data,
    suppliers: suppliers.data,
    locations: locations.data,
    banks: banks.data,
    agents: agents.data,
    settings: settings.data,
    loading,
    error,
    refresh,
  };
}
