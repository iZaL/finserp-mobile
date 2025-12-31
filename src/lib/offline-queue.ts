/**
 * Offline mutation queue service
 * Queues mutations when offline and syncs them when connection is restored
 */

import {api} from './api';
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  updateQueueRetry,
} from './indexeddb';

const MAX_RETRIES = 3;

export interface QueuedMutation {
  id: string;
  method: string;
  url: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

class OfflineQueueService {
  private isProcessing = false;
  private listeners: Set<(count: number) => void> = new Set();
  private syncInterval: NodeJS.Timeout | null = null;

  /**
   * Check if device is online
   */
  private isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Queue a mutation for later execution
   */
  async queueMutation(
    method: string,
    url: string,
    data: unknown
  ): Promise<string> {
    const id = await addToOfflineQueue(method, url, data);
    this.notifyListeners();
    return id;
  }

  /**
   * Process queued mutations
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline()) {
      return;
    }

    this.isProcessing = true;

    try {
      const queue = await getOfflineQueue();

      if (queue.length === 0) {
        this.isProcessing = false;
        this.notifyListeners();
        return;
      }

      // Process mutations in order
      for (const mutation of queue) {
        if (!this.isOnline()) {
          break; // Stop processing if we go offline
        }

        try {
          // Execute the mutation
          switch (mutation.method.toUpperCase()) {
            case 'POST':
              await api.post(mutation.url, mutation.data);
              break;
            case 'PUT':
            case 'PATCH':
              await api.put(mutation.url, mutation.data);
              break;
            case 'DELETE':
              await api.delete(mutation.url);
              break;
            default:
              console.warn(`Unsupported method: ${mutation.method}`);
              await removeFromOfflineQueue(mutation.id);
              continue;
          }

          // Success - remove from queue
          await removeFromOfflineQueue(mutation.id);
          console.log(`Successfully synced mutation ${mutation.id}`);
        } catch (error: unknown) {
          // Check if it's a network error or timeout
          const errorObj = error as {
            isNetworkError?: boolean;
            isTimeout?: boolean;
            response?: unknown;
          };
          const isNetworkError =
            errorObj.isNetworkError || errorObj.isTimeout || !errorObj.response;

          if (isNetworkError && mutation.retries < MAX_RETRIES) {
            // Retry later
            await updateQueueRetry(mutation.id, mutation.retries + 1);
            console.log(
              `Failed to sync mutation ${mutation.id}, will retry (attempt ${mutation.retries + 1}/${MAX_RETRIES})`
            );
          } else {
            // Max retries reached or non-network error - remove from queue
            await removeFromOfflineQueue(mutation.id);
            console.error(
              `Failed to sync mutation ${mutation.id} after ${mutation.retries} retries:`,
              error
            );
          }
        }

        // Small delay between mutations to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error processing offline queue:', error);
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  /**
   * Get current queue count
   */
  async getQueueCount(): Promise<number> {
    const queue = await getOfflineQueue();
    return queue.length;
  }

  /**
   * Start automatic queue processing
   */
  startAutoSync(): void {
    if (this.syncInterval) {
      return; // Already started
    }

    // Process queue immediately if online
    if (this.isOnline()) {
      this.processQueue();
    }

    // Process queue every 5 seconds when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline()) {
        this.processQueue();
      }
    }, 5000);

    // Also process when connection is restored
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('Connection restored, processing offline queue...');
        this.processQueue();
      });
    }
  }

  /**
   * Stop automatic queue processing
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Subscribe to queue count changes
   */
  subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current count
    this.getQueueCount().then((count) => listener(count));

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of queue count change
   */
  private async notifyListeners(): Promise<void> {
    const count = await this.getQueueCount();
    this.listeners.forEach((listener) => listener(count));
  }
}

// Export singleton instance
export const offlineQueueService = new OfflineQueueService();

// Start auto-sync when module loads (if in browser)
if (typeof window !== 'undefined') {
  offlineQueueService.startAutoSync();
}
