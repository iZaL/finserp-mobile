import { useState, useEffect, useCallback } from "react";
import { fishPurchaseService } from "@/lib/services/fish-purchase";
import type {
  FishPurchase,
  FishPurchaseFilters,
  CreateFishPurchaseRequest,
  UpdateFishPurchaseRequest,
  UpdateStatusRequest,
} from "@/types/fish-purchase";
import type { PaginatedResponse } from "@/types/shared";
import { toast } from "sonner";

/**
 * Hook to fetch paginated fish purchases with filters
 */
export function useFishPurchases(filters?: FishPurchaseFilters) {
  const [data, setData] = useState<PaginatedResponse<FishPurchase> | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPurchases = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setLoading(true);
        setError(null);
        const result = await fishPurchaseService.getFishPurchases(filters, {
          signal,
        });
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          toast.error("Failed to fetch fish purchases");
        }
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPurchases(controller.signal);
    return () => controller.abort();
  }, [fetchPurchases]);

  const refresh = () => fetchPurchases();

  return { data, loading, error, refresh };
}

/**
 * Hook to fetch single fish purchase by ID
 */
export function useFishPurchase(id: number | null) {
  const [data, setData] = useState<FishPurchase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPurchase = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.getFishPurchase(id);
      setData(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        toast.error("Failed to fetch fish purchase");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPurchase();
  }, [fetchPurchase]);

  const refresh = () => fetchPurchase();

  return { data, loading, error, refresh };
}

/**
 * Hook to create a new fish purchase
 */
export function useCreateFishPurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createPurchase = async (data: CreateFishPurchaseRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.createFishPurchase(data);
      toast.success("Fish purchase created successfully");
      return result;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        toast.error(err.message || "Failed to create fish purchase");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createPurchase, loading, error };
}

/**
 * Hook to update a fish purchase
 */
export function useUpdateFishPurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePurchase = async (
    id: number,
    data: UpdateFishPurchaseRequest
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.updateFishPurchase(id, data);
      toast.success("Fish purchase updated successfully");
      return result;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        toast.error(err.message || "Failed to update fish purchase");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updatePurchase, loading, error };
}

/**
 * Hook to delete a fish purchase
 */
export function useDeleteFishPurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deletePurchase = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await fishPurchaseService.deleteFishPurchase(id);
      toast.success("Fish purchase deleted successfully");
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        toast.error(err.message || "Failed to delete fish purchase");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deletePurchase, loading, error };
}

/**
 * Hook to update fish purchase status
 */
export function useUpdateFishPurchaseStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateStatus = async (id: number, data: UpdateStatusRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fishPurchaseService.updateStatus(id, data);
      toast.success(`Fish purchase ${data.status} successfully`);
      return result;
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
        toast.error(err.message || "Failed to update status");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateStatus, loading, error };
}
