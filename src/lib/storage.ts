/**
 * IndexedDB Storage Layer
 *
 * Provides offline-first local storage using IndexedDB.
 * Acts as a cache layer for FoodItems, allowing the app to work offline
 * and sync changes back to Firestore when connection is restored.
 */

import type { FoodItem } from '@/types'

/**
 * Database and store names
 */
const DB_NAME = 'BestBiteDB'
const STORE_NAMES = {
  FOOD_ITEMS: 'food_items',
  METADATA: 'metadata',
} as const

/**
 * Metadata keys for tracking sync state
 */
const METADATA_KEYS = {
  LAST_SYNC: 'last_sync_timestamp',
} as const

/**
 * Get or create IndexedDB instance
 */
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create food_items store (keyPath: id)
      if (!db.objectStoreNames.contains(STORE_NAMES.FOOD_ITEMS)) {
        const foodStore = db.createObjectStore(STORE_NAMES.FOOD_ITEMS, { keyPath: 'id' })
        foodStore.createIndex('expiry_date', 'expiry_date', { unique: false })
        foodStore.createIndex('status', 'status', { unique: false })
        foodStore.createIndex('created_at', 'created_at', { unique: false })
      }

      // Create metadata store for sync tracking
      if (!db.objectStoreNames.contains(STORE_NAMES.METADATA)) {
        db.createObjectStore(STORE_NAMES.METADATA, { keyPath: 'key' })
      }
    }
  })
}

/**
 * Initialize IndexedDB storage
 * Should be called once during app initialization
 */
export async function initStorage(): Promise<void> {
  try {
    await getDB()
    if (process.env.NODE_ENV === 'development') {
      console.log('[Storage] IndexedDB initialized successfully')
    }
  } catch (error) {
    console.error('[Storage] Failed to initialize IndexedDB:', error)
    throw error
  }
}

/**
 * Get all food items from IndexedDB
 */
export async function getAllFoodItems(): Promise<FoodItem[]> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)

    return new Promise((resolve, reject) => {
      const request = store.getAll()

      request.onerror = () => {
        reject(new Error('Failed to retrieve food items'))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  } catch (error) {
    console.error('[Storage] Error getting all items:', error)
    throw error
  }
}

/**
 * Get a single food item by ID
 */
export async function getFoodItem(id: string): Promise<FoodItem | null> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)

    return new Promise((resolve, reject) => {
      const request = store.get(id)

      request.onerror = () => {
        reject(new Error(`Failed to retrieve item ${id}`))
      }

      request.onsuccess = () => {
        resolve(request.result || null)
      }
    })
  } catch (error) {
    console.error('[Storage] Error getting item:', error)
    throw error
  }
}

/**
 * Add a food item to IndexedDB
 */
export async function addFoodItem(item: FoodItem): Promise<void> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)

    return new Promise((resolve, reject) => {
      const request = store.add(item)

      request.onerror = () => {
        reject(new Error(`Failed to add item ${item.id}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[Storage] Error adding item:', error)
    throw error
  }
}

/**
 * Update a food item in IndexedDB
 */
export async function updateFoodItem(id: string, updates: Partial<FoodItem>): Promise<void> {
  try {
    const db = await getDB()

    // First, check if item exists
    const item = await getFoodItem(id)
    if (!item) {
      throw new Error(`Item ${id} not found`)
    }

    // Then perform update in a separate transaction
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)
    const updatedItem = { ...item, ...updates, id: item.id }

    return new Promise((resolve, reject) => {
      const request = store.put(updatedItem)

      request.onerror = () => {
        reject(new Error(`Failed to update item ${id}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[Storage] Error updating item:', error)
    throw error
  }
}

/**
 * Delete a food item from IndexedDB
 */
export async function deleteFoodItem(id: string): Promise<void> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)

      request.onerror = () => {
        reject(new Error(`Failed to delete item ${id}`))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[Storage] Error deleting item:', error)
    throw error
  }
}

/**
 * Delete all food items from IndexedDB (used for testing or reset)
 */
export async function clearAllFoodItems(): Promise<void> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)

    return new Promise((resolve, reject) => {
      const request = store.clear()

      request.onerror = () => {
        reject(new Error('Failed to clear items'))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[Storage] Error clearing items:', error)
    throw error
  }
}

/**
 * Get the last sync timestamp from metadata
 */
export async function getLastSyncTime(): Promise<number> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.METADATA, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.METADATA)

    return new Promise((resolve) => {
      const request = store.get(METADATA_KEYS.LAST_SYNC)

      request.onerror = () => {
        resolve(0) // Return 0 if not found (no sync yet)
      }

      request.onsuccess = () => {
        resolve(request.result?.value || 0)
      }
    })
  } catch (error) {
    console.error('[Storage] Error getting last sync time:', error)
    return 0
  }
}

/**
 * Set the last sync timestamp in metadata
 */
export async function setLastSyncTime(timestamp: number): Promise<void> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.METADATA, 'readwrite')
    const store = transaction.objectStore(STORE_NAMES.METADATA)

    return new Promise((resolve, reject) => {
      const request = store.put({
        key: METADATA_KEYS.LAST_SYNC,
        value: timestamp,
      })

      request.onerror = () => {
        reject(new Error('Failed to set sync timestamp'))
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  } catch (error) {
    console.error('[Storage] Error setting last sync time:', error)
    throw error
  }
}

/**
 * Get items from IndexedDB by status
 */
export async function getFoodItemsByStatus(status: string): Promise<FoodItem[]> {
  try {
    const db = await getDB()
    const transaction = db.transaction(STORE_NAMES.FOOD_ITEMS, 'readonly')
    const store = transaction.objectStore(STORE_NAMES.FOOD_ITEMS)
    const index = store.index('status')

    return new Promise((resolve, reject) => {
      const request = index.getAll(status)

      request.onerror = () => {
        reject(new Error(`Failed to retrieve items with status ${status}`))
      }

      request.onsuccess = () => {
        resolve(request.result)
      }
    })
  } catch (error) {
    console.error('[Storage] Error getting items by status:', error)
    throw error
  }
}

/**
 * Check if an item exists in storage
 */
export async function itemExists(id: string): Promise<boolean> {
  try {
    const item = await getFoodItem(id)
    return item !== null
  } catch {
    return false
  }
}
