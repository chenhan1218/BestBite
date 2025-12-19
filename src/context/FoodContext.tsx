'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { FoodItem, FoodItemInput } from '@/types'

/**
 * Get or create a user ID for local data storage
 * This is a temporary solution until authentication is implemented
 */
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') {
    return 'default-user'
  }

  const stored = localStorage.getItem('bestbite_user_id')
  if (stored) {
    return stored
  }

  const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  localStorage.setItem('bestbite_user_id', newId)
  return newId
}

import {
  createFoodItem,
  readAllFoodItems,
  updateFoodItem as updateFoodItemInFirestore,
  deleteFoodItem as deleteFoodItemFromFirestore,
  uploadImageToStorage,
  deleteImageFromStorage,
} from '@/lib/firestore'
import {
  addFoodItem as addFoodItemToStorage,
  getAllFoodItems as getAllFoodItemsFromStorage,
  updateFoodItem as updateFoodItemInStorage,
  deleteFoodItem as deleteFoodItemFromStorage,
} from '@/lib/storage'
import { calculateDaysUntilExpiry, getFoodStatus, sortByExpiryDate } from '@/lib/date'

interface FoodContextType {
  // State
  items: FoodItem[]
  loading: boolean
  error: string | null

  // Statistics
  redItems: FoodItem[]
  yellowItems: FoodItem[]
  greenItems: FoodItem[]
  totalItems: number

  // Operations
  addItem: (imageFile: File, data: FoodItemInput) => Promise<FoodItem>
  updateItem: (id: string, data: Partial<FoodItemInput>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  refreshItems: () => Promise<void>
}

const FoodContext = createContext<FoodContextType | undefined>(undefined)

export function FoodProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate statistics
  const redItems = items.filter((item) => item.status === 'red')
  const yellowItems = items.filter((item) => item.status === 'yellow')
  const greenItems = items.filter((item) => item.status === 'green')
  const totalItems = items.length

  // Refresh items from Firestore and IndexedDB
  const refreshItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const userId = getOrCreateUserId()

      // Try to get from Firestore first
      try {
        const firestoreItems = await readAllFoodItems(userId)
        const enrichedItems = firestoreItems.map((item) => {
          const days = calculateDaysUntilExpiry(item.expiry_date)
          return {
            ...item,
            days_until_expiry: days,
            status: getFoodStatus(days),
          }
        })
        const sortedItems = sortByExpiryDate(enrichedItems)

        setItems(sortedItems)

        // Sync to local storage
        for (const item of sortedItems) {
          await addFoodItemToStorage(item)
        }
      } catch (firestoreError) {
        // Fallback to local storage if Firestore fails
        console.warn('Failed to fetch from Firestore, using local storage:', firestoreError)
        const localItems = await getAllFoodItemsFromStorage()
        const enrichedItems = localItems.map((item) => {
          const days = calculateDaysUntilExpiry(item.expiry_date)
          return {
            ...item,
            days_until_expiry: days,
            status: getFoodStatus(days),
          }
        })
        const sortedItems = sortByExpiryDate(enrichedItems)
        setItems(sortedItems)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load items'
      setError(errorMessage)
      console.error('Error refreshing items:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Add item (assumes image_url is already provided or will be added later)
  const addItem = useCallback(
    async (imageFile: File, data: FoodItemInput): Promise<FoodItem> => {
      try {
        setError(null)

        const userId = getOrCreateUserId()

        // Create Firestore item first
        const newItem = await createFoodItem(userId, data)

        // Upload image after creating the item (so we have itemId)
        try {
          const imageUrl = await uploadImageToStorage(userId, newItem.id, imageFile)
          // Update the item with the image URL
          await updateFoodItemInFirestore(userId, newItem.id, { image_url: imageUrl })
          newItem.image_url = imageUrl
        } catch (uploadError) {
          console.warn('Failed to upload image, continuing without it:', uploadError)
        }

        // Enrich item with computed fields
        const days = calculateDaysUntilExpiry(newItem.expiry_date)
        const enrichedItem: FoodItem = {
          ...newItem,
          days_until_expiry: days,
          status: getFoodStatus(days),
        }

        // Add to local storage
        await addFoodItemToStorage(enrichedItem)

        // Update state
        const updatedItems = [...items, enrichedItem]
        setItems(sortByExpiryDate(updatedItems))

        return enrichedItem
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to add item'
        setError(errorMessage)
        throw err
      }
    },
    [items]
  )

  // Update item
  const updateItem = useCallback(
    async (id: string, data: Partial<FoodItemInput>) => {
      try {
        setError(null)

        const userId = getOrCreateUserId()

        await updateFoodItemInFirestore(userId, id, data)
        await updateFoodItemInStorage(id, data)

        // Update state
        const updatedItems = items.map((item) => {
          if (item.id === id) {
            const newDays = data.expiry_date
              ? calculateDaysUntilExpiry(data.expiry_date)
              : item.days_until_expiry
            return {
              ...item,
              ...data,
              days_until_expiry: newDays,
              status: data.expiry_date ? getFoodStatus(newDays) : item.status,
              updated_at: new Date(),
            }
          }
          return item
        })

        setItems(sortByExpiryDate(updatedItems))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update item'
        setError(errorMessage)
        throw err
      }
    },
    [items]
  )

  // Delete item
  const deleteItem = useCallback(
    async (id: string) => {
      try {
        setError(null)

        const userId = getOrCreateUserId()

        const itemToDelete = items.find((item) => item.id === id)
        if (itemToDelete) {
          // Delete image from storage
          await deleteImageFromStorage(userId, id)
        }

        await deleteFoodItemFromFirestore(userId, id)
        await deleteFoodItemFromStorage(id)

        // Update state
        setItems(items.filter((item) => item.id !== id))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete item'
        setError(errorMessage)
        throw err
      }
    },
    [items]
  )

  // Load items on mount
  useEffect(() => {
    refreshItems()
  }, [refreshItems])

  const value: FoodContextType = {
    items,
    loading,
    error,
    redItems,
    yellowItems,
    greenItems,
    totalItems,
    addItem,
    updateItem,
    deleteItem,
    refreshItems,
  }

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>
}

export function useFoodContext() {
  const context = useContext(FoodContext)
  if (context === undefined) {
    throw new Error('useFoodContext must be used within FoodProvider')
  }
  return context
}
