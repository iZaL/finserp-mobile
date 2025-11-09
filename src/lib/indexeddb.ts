/**
 * IndexedDB utility for persistent offline storage
 * Used for caching API responses and storing offline mutation queue
 */

const DB_NAME = "finserp-offline-db"
const DB_VERSION = 1

// Store names
export const STORES = {
  API_CACHE: "api_cache",
  OFFLINE_QUEUE: "offline_queue",
} as const

interface DBSchema {
  [STORES.API_CACHE]: {
    key: string // URL + query params
    value: unknown // Cached response data
    timestamp: number // Cache timestamp
    expiresAt: number // Expiration timestamp
  }
  [STORES.OFFLINE_QUEUE]: {
    id: string // Unique ID for the queued mutation
    method: string // HTTP method
    url: string // API endpoint
    data: unknown // Request payload
    timestamp: number // When it was queued
    retries: number // Number of retry attempts
  }
}

/**
 * Open or create the IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported"))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create API cache store
      if (!db.objectStoreNames.contains(STORES.API_CACHE)) {
        const cacheStore = db.createObjectStore(STORES.API_CACHE, {
          keyPath: "key",
        })
        cacheStore.createIndex("expiresAt", "expiresAt", { unique: false })
        cacheStore.createIndex("timestamp", "timestamp", { unique: false })
      }

      // Create offline queue store
      if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
          keyPath: "id",
        })
        queueStore.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

/**
 * Get cached API response
 */
export async function getCachedResponse(
  key: string
): Promise<unknown | null> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.API_CACHE], "readonly")
      const store = transaction.objectStore(STORES.API_CACHE)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (!result) {
          resolve(null)
          return
        }

        // Check if cache is expired
        if (result.expiresAt && Date.now() > result.expiresAt) {
          // Delete expired cache
          deleteCachedResponse(key).catch(console.error)
          resolve(null)
          return
        }

        resolve(result.value)
      }
    })
  } catch (error) {
    console.error("Error getting cached response:", error)
    return null
  }
}

/**
 * Cache API response
 */
export async function cacheResponse(
  key: string,
  value: unknown,
  ttl: number = 24 * 60 * 60 * 1000 // Default 24 hours
): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.API_CACHE], "readwrite")
      const store = transaction.objectStore(STORES.API_CACHE)
      const request = store.put({
        key,
        value,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error("Error caching response:", error)
  }
}

/**
 * Delete cached response
 */
export async function deleteCachedResponse(key: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.API_CACHE], "readwrite")
      const store = transaction.objectStore(STORES.API_CACHE)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error("Error deleting cached response:", error)
  }
}

/**
 * Clear all expired cache entries
 */
export async function clearExpiredCache(): Promise<number> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.API_CACHE], "readwrite")
      const store = transaction.objectStore(STORES.API_CACHE)
      const index = store.index("expiresAt")
      const range = IDBKeyRange.upperBound(Date.now())
      const request = index.openCursor(range)
      let deletedCount = 0

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          deletedCount++
          cursor.continue()
        } else {
          resolve(deletedCount)
        }
      }
    })
  } catch (error) {
    console.error("Error clearing expired cache:", error)
    return 0
  }
}

/**
 * Add mutation to offline queue
 */
export async function addToOfflineQueue(
  method: string,
  url: string,
  data: unknown
): Promise<string> {
  try {
    const db = await openDB()
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OFFLINE_QUEUE], "readwrite")
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE)
      const request = store.add({
        id,
        method,
        url,
        data,
        timestamp: Date.now(),
        retries: 0,
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(id)
    })
  } catch (error) {
    console.error("Error adding to offline queue:", error)
    throw error
  }
}

/**
 * Get all queued mutations
 */
export async function getOfflineQueue(): Promise<
  DBSchema[typeof STORES.OFFLINE_QUEUE][]
> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OFFLINE_QUEUE], "readonly")
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE)
      const index = store.index("timestamp")
      const request = index.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(Array.isArray(result) ? result : [])
      }
    })
  } catch (error) {
    console.error("Error getting offline queue:", error)
    return []
  }
}

/**
 * Remove mutation from offline queue
 */
export async function removeFromOfflineQueue(id: string): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OFFLINE_QUEUE], "readwrite")
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  } catch (error) {
    console.error("Error removing from offline queue:", error)
  }
}

/**
 * Update retry count for queued mutation
 */
export async function updateQueueRetry(id: string, retries: number): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.OFFLINE_QUEUE], "readwrite")
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE)
      const getRequest = store.get(id)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const item = getRequest.result
        if (item) {
          item.retries = retries
          const putRequest = store.put(item)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }
    })
  } catch (error) {
    console.error("Error updating queue retry:", error)
  }
}

/**
 * Clear all cached data (useful for logout or cache reset)
 */
export async function clearAllCache(): Promise<void> {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        [STORES.API_CACHE, STORES.OFFLINE_QUEUE],
        "readwrite"
      )

      const cacheStore = transaction.objectStore(STORES.API_CACHE)
      const queueStore = transaction.objectStore(STORES.OFFLINE_QUEUE)

      const cacheRequest = cacheStore.clear()
      const queueRequest = queueStore.clear()

      let completed = 0
      const checkComplete = () => {
        completed++
        if (completed === 2) {
          resolve()
        }
      }

      cacheRequest.onsuccess = checkComplete
      queueRequest.onsuccess = checkComplete
      cacheRequest.onerror = () => reject(cacheRequest.error)
      queueRequest.onerror = () => reject(queueRequest.error)
    })
  } catch (error) {
    console.error("Error clearing all cache:", error)
  }
}

// Clean up expired cache on initialization
if (typeof window !== "undefined") {
  clearExpiredCache().catch(console.error)
  // Clean up expired cache every hour
  setInterval(() => {
    clearExpiredCache().catch(console.error)
  }, 60 * 60 * 1000)
}

