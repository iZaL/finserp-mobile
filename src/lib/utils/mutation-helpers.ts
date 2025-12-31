import {QueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';

/**
 * Helper utilities for React Query mutations
 * Provides reusable patterns for cache invalidation and error handling
 */

/**
 * Invalidate only the necessary caches after a mutation
 * More efficient than invalidating everything
 *
 * @param queryClient - React Query client
 * @param keys - Array of query keys to invalidate
 */
export async function invalidateTargetedCaches(
  queryClient: QueryClient,
  keys: unknown[][]
): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      queryClient.invalidateQueries({
        queryKey: key,
        refetchType: 'active', // Only refetch active queries
      })
    )
  );
}

/**
 * Refetch specific queries after a mutation
 * Use this for critical data that must be fresh
 *
 * @param queryClient - React Query client
 * @param keys - Array of query keys to refetch
 */
export async function refetchTargetedQueries(
  queryClient: QueryClient,
  keys: unknown[][]
): Promise<void> {
  await Promise.all(
    keys.map((key) =>
      queryClient.refetchQueries({
        queryKey: key,
        type: 'active', // Only refetch active queries
      })
    )
  );
}

/**
 * Standard success handler for mutations
 * Invalidates caches and shows success toast
 *
 * @param queryClient - React Query client
 * @param options - Configuration options
 */
export async function handleMutationSuccess(
  queryClient: QueryClient,
  options: {
    invalidateKeys?: unknown[][];
    refetchKeys?: unknown[][];
    successMessage?: string;
    updateDetailCache?: {
      key: unknown[];
      data: unknown;
    };
  }
): Promise<void> {
  const {invalidateKeys, refetchKeys, successMessage, updateDetailCache} =
    options;

  // Update detail cache optimistically if provided
  if (updateDetailCache) {
    queryClient.setQueryData(updateDetailCache.key, updateDetailCache.data);
  }

  // Invalidate caches
  if (invalidateKeys && invalidateKeys.length > 0) {
    await invalidateTargetedCaches(queryClient, invalidateKeys);
  }

  // Refetch specific queries
  if (refetchKeys && refetchKeys.length > 0) {
    await refetchTargetedQueries(queryClient, refetchKeys);
  }

  // Show success message
  if (successMessage) {
    toast.success(successMessage);
  }
}

/**
 * Standard error handler for mutations
 * Shows error toast with proper message extraction
 *
 * @param error - Error object
 * @param fallbackMessage - Fallback message if error message not found
 */
export function handleMutationError(
  error: unknown,
  fallbackMessage: string
): void {
  const message = error instanceof Error ? error.message : fallbackMessage;

  toast.error(message);
}

/**
 * Create optimistic update context for rollback
 * Use this pattern for instant UI feedback
 *
 * @param queryClient - React Query client
 * @param queryKey - Key of the query to update
 * @returns Previous data for rollback
 */
export async function createOptimisticContext<T>(
  queryClient: QueryClient,
  queryKey: unknown[]
): Promise<T | undefined> {
  // Cancel outgoing queries
  await queryClient.cancelQueries({queryKey});

  // Get previous data for rollback
  const previousData = queryClient.getQueryData<T>(queryKey);

  return previousData;
}

/**
 * Rollback optimistic update on error
 *
 * @param queryClient - React Query client
 * @param queryKey - Key of the query to rollback
 * @param previousData - Previous data to restore
 */
export function rollbackOptimisticUpdate<T>(
  queryClient: QueryClient,
  queryKey: unknown[],
  previousData: T | undefined
): void {
  if (previousData) {
    queryClient.setQueryData(queryKey, previousData);
  }
}
