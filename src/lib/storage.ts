/**
 * Local Storage Utilities (IndexedDB)
 *
 * Provides offline storage capabilities using IndexedDB.
 * Enables the app to work offline and sync with Firestore when online.
 *
 * Functions:
 * - openDB: Initialize IndexedDB
 * - saveToLocal: Save food items to local storage
 * - loadFromLocal: Load food items from local storage
 * - deleteFromLocal: Delete food item from local storage
 * - clearLocalStorage: Clear all local data
 *
 * Usage:
 *   import { saveToLocal, loadFromLocal } from '@/lib/storage'
 */

import { FoodItem } from '@/types'

const DB_NAME = 'BestBiteDB'
const DB_VERSION = 1
const STORE_NAME = 'foodItems'

/**
 * Open or create IndexedDB database
 *
 * @returns Promise<IDBDatabase> - Database instance
 */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('!Õ‹_,0Ç™«'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' })

        // Create indexes for efficient querying
        objectStore.createIndex('status', 'status', { unique: false })
        objectStore.createIndex('expiry_date', 'expiry_date', { unique: false })
        objectStore.createIndex('created_at', 'created_at', { unique: false })

        console.log(' IndexedDB object store created')
      }
    }
  })
}

/**
 * Save a food item to local storage
 *
 * @param item - Food item to save
 * @returns Promise<void>
 *
 * @example
 * await saveToLocal(foodItem)
 */
export async function saveToLocal(item: FoodItem): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // Convert Date objects to ISO strings for storage
    const storableItem = {
      ...item,
      created_at: item.created_at instanceof Date ? item.created_at.toISOString() : item.created_at,
      updated_at: item.updated_at instanceof Date ? item.updated_at.toISOString() : item.updated_at,
    }

    return new Promise((resolve, reject) => {
      const request = store.put(storableItem)

      request.onsuccess = () => {
        console.log(' Saved to local storage:', item.id)
        resolve()
      }

      request.onerror = () => {
        reject(new Error('!Õ2X0,0Ç™«'))
      }
    })
  } catch (error) {
    console.error('Error saving to local storage:', error)
    throw error
  }
}

/**
 * Load all food items from local storage
 *
 * @returns Promise<FoodItem[]> - Array of food items
 *
 * @example
 * const items = await loadFromLocal()
 */
export async function loadFromLocal(): Promise<FoodItem[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()

      request.onsuccess = () => {
        const items = request.result.map((item: any) => ({
          ...item,
          // Convert ISO strings back to Date objects
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
        }))

        console.log(` Loaded ${items.length} items from local storage`)
        resolve(items)
      }

      request.onerror = () => {
        reject(new Error('!Õž,0Ç™«€Ö'))
      }
    })
  } catch (error) {
    console.error('Error loading from local storage:', error)
    return []
  }
}

/**
 * Get a single food item from local storage by ID
 *
 * @param id - Food item ID
 * @returns Promise<FoodItem | null> - Food item or null if not found
 *
 * @example
 * const item = await getFromLocal('abc123')
 */
export async function getFromLocal(id: string): Promise<FoodItem | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(id)

      request.onsuccess = () => {
        if (request.result) {
          const item = {
            ...request.result,
            created_at: new Date(request.result.created_at),
            updated_at: new Date(request.result.updated_at),
          }
          resolve(item)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        reject(new Error('!Õž,0Ç™«€Ö'))
      }
    })
  } catch (error) {
    console.error('Error getting item from local storage:', error)
    return null
  }
}

/**
 * Delete a food item from local storage
 *
 * @param id - Food item ID to delete
 * @returns Promise<void>
 *
 * @example
 * await deleteFromLocal('abc123')
 */
export async function deleteFromLocal(id: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)

      request.onsuccess = () => {
        console.log(' Deleted from local storage:', id)
        resolve()
      }

      request.onerror = () => {
        reject(new Error('!Õž,0Ç™«*d'))
      }
    })
  } catch (error) {
    console.error('Error deleting from local storage:', error)
    throw error
  }
}

/**
 * Clear all food items from local storage
 *
 * @returns Promise<void>
 *
 * @example
 * await clearLocalStorage()
 */
export async function clearLocalStorage(): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.clear()

      request.onsuccess = () => {
        console.log(' Cleared all items from local storage')
        resolve()
      }

      request.onerror = () => {
        reject(new Error('!Õz,0Ç™«'))
      }
    })
  } catch (error) {
    console.error('Error clearing local storage:', error)
    throw error
  }
}

/**
 * Get food items by status from local storage
 *
 * @param status - Food status ('red', 'yellow', 'green')
 * @returns Promise<FoodItem[]> - Array of food items with matching status
 *
 * @example
 * const redItems = await getItemsByStatus('red')
 */
export async function getItemsByStatus(
  status: 'red' | 'yellow' | 'green'
): Promise<FoodItem[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const index = store.index('status')

    return new Promise((resolve, reject) => {
      const request = index.getAll(status)

      request.onsuccess = () => {
        const items = request.result.map((item: any) => ({
          ...item,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
        }))

        resolve(items)
      }

      request.onerror = () => {
        reject(new Error('!Õž,0Ç™«€Ö'))
      }
    })
  } catch (error) {
    console.error('Error getting items by status:', error)
    return []
  }
}

/**
 * Count total items in local storage
 *
 * @returns Promise<number> - Total count
 *
 * @example
 * const count = await countLocalItems()
 */
export async function countLocalItems(): Promise<number> {
  try {
    const db = await openDB()
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.count()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        reject(new Error('!Õq,0Ç™'))
      }
    })
  } catch (error) {
    console.error('Error counting local items:', error)
    return 0
  }
}

/**
 * Check if IndexedDB is supported
 *
 * @returns boolean - True if supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined'
}
