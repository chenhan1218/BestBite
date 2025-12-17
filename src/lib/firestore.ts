/**
 * Firestore CRUD Operations
 *
 * Encapsulates all Firestore database operations for food items,
 * and Firebase Storage operations for image uploads.
 */

import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  QueryConstraint,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage, FIRESTORE_PATHS, STORAGE_PATHS } from './firebase'
import type { FoodItem, FoodItemInput } from '@/types'
import { calculateDaysUntilExpiry, getFoodStatus } from './date'

/**
 * Create a new food item in Firestore
 * Assigns a server-generated ID and calculates derived fields
 */
export async function createFoodItem(
  userId: string,
  input: FoodItemInput
): Promise<FoodItem> {
  try {
    const now = new Date()
    const daysUntilExpiry = calculateDaysUntilExpiry(input.expiry_date)
    const status = getFoodStatus(daysUntilExpiry)

    const foodItem: FoodItem = {
      id: '', // Will be set by Firestore
      ...input,
      days_until_expiry: daysUntilExpiry,
      status,
      created_at: now,
      updated_at: now,
    }

    // Add document to Firestore with auto-generated ID
    const foodItemsRef = collection(db, FIRESTORE_PATHS.foodItems(userId))
    const docRef = await addDoc(foodItemsRef, {
      ...foodItem,
      id: undefined, // Let Firestore generate ID
    })

    // Return the created item with the generated ID
    return {
      ...foodItem,
      id: docRef.id,
    }
  } catch (error) {
    console.error('[Firestore] Error creating food item:', error)
    throw error
  }
}

/**
 * Read a single food item by ID
 */
export async function readFoodItem(
  userId: string,
  itemId: string
): Promise<FoodItem | null> {
  try {
    const docRef = doc(db, FIRESTORE_PATHS.foodItem(userId, itemId))
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      ...data,
      id: docSnap.id,
      created_at: data.created_at?.toDate?.() || new Date(data.created_at),
      updated_at: data.updated_at?.toDate?.() || new Date(data.updated_at),
    } as FoodItem
  } catch (error) {
    console.error('[Firestore] Error reading food item:', error)
    throw error
  }
}

/**
 * Read all food items for a user, optionally filtered and sorted
 */
export async function readAllFoodItems(
  userId: string,
  constraints: QueryConstraint[] = []
): Promise<FoodItem[]> {
  try {
    const foodItemsRef = collection(db, FIRESTORE_PATHS.foodItems(userId))

    // Default: sort by expiry_date ascending (soonest first)
    const defaultConstraints: QueryConstraint[] = [orderBy('expiry_date', 'asc')]

    const q = query(foodItemsRef, ...defaultConstraints, ...constraints)
    const querySnapshot = await getDocs(q)

    const items: FoodItem[] = []
    querySnapshot.forEach((doc) => {
      const data = doc.data()
      items.push({
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate?.() || new Date(data.created_at),
        updated_at: data.updated_at?.toDate?.() || new Date(data.updated_at),
      } as FoodItem)
    })

    return items
  } catch (error) {
    console.error('[Firestore] Error reading all items:', error)
    throw error
  }
}

/**
 * Update a food item
 * Recalculates derived fields (days_until_expiry, status) if expiry_date changes
 */
export async function updateFoodItem(
  userId: string,
  itemId: string,
  updates: Partial<FoodItemInput>
): Promise<void> {
  try {
    const now = new Date()

    // Calculate derived fields if expiry_date is being updated
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: now,
    }

    if (updates.expiry_date) {
      updateData.days_until_expiry = calculateDaysUntilExpiry(updates.expiry_date)
      updateData.status = getFoodStatus(updateData.days_until_expiry as number)
    }

    const docRef = doc(db, FIRESTORE_PATHS.foodItem(userId, itemId))
    await updateDoc(docRef, updateData)
  } catch (error) {
    console.error('[Firestore] Error updating food item:', error)
    throw error
  }
}

/**
 * Delete a food item and its associated image from storage
 */
export async function deleteFoodItem(userId: string, itemId: string): Promise<void> {
  try {
    // Delete from Firestore
    const docRef = doc(db, FIRESTORE_PATHS.foodItem(userId, itemId))
    await deleteDoc(docRef)

    // Delete image from Storage (ignore errors if image doesn't exist)
    try {
      const imageRef = ref(storage, STORAGE_PATHS.userImage(userId, itemId))
      await deleteObject(imageRef)
    } catch (storageError) {
      console.warn('[Firestore] Image deletion failed (may not exist):', storageError)
    }
  } catch (error) {
    console.error('[Firestore] Error deleting food item:', error)
    throw error
  }
}

/**
 * Upload an image to Firebase Storage
 * Returns the public download URL
 */
export async function uploadImageToStorage(
  userId: string,
  itemId: string,
  file: File
): Promise<string> {
  try {
    // Create storage reference
    const imageRef = ref(storage, STORAGE_PATHS.userImage(userId, itemId))

    // Upload file
    await uploadBytes(imageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        itemId,
        uploadedAt: new Date().toISOString(),
      },
    })

    // Get download URL
    const downloadURL = await getDownloadURL(imageRef)
    return downloadURL
  } catch (error) {
    console.error('[Firestore] Error uploading image:', error)
    throw error
  }
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteImageFromStorage(userId: string, itemId: string): Promise<void> {
  try {
    const imageRef = ref(storage, STORAGE_PATHS.userImage(userId, itemId))
    await deleteObject(imageRef)
  } catch (error) {
    // Ignore error if image doesn't exist
    if ((error as any)?.code !== 'storage/object-not-found') {
      console.warn('[Firestore] Error deleting image:', error)
    }
  }
}

/**
 * Batch delete multiple food items
 * Useful for clearing user's entire collection
 */
export async function batchDeleteFoodItems(userId: string, itemIds: string[]): Promise<void> {
  try {
    if (itemIds.length === 0) return

    const batch = writeBatch(db)

    itemIds.forEach((itemId) => {
      const docRef = doc(db, FIRESTORE_PATHS.foodItem(userId, itemId))
      batch.delete(docRef)
    })

    await batch.commit()
  } catch (error) {
    console.error('[Firestore] Error batch deleting items:', error)
    throw error
  }
}

/**
 * Get food items by status
 */
export async function getFoodItemsByStatus(
  userId: string,
  status: string
): Promise<FoodItem[]> {
  try {
    const { query: QueryClass } = await import('firebase/firestore')
    const foodItemsRef = collection(db, FIRESTORE_PATHS.foodItems(userId))

    // Dynamic import to avoid issues
    const { where } = await import('firebase/firestore')
    const q = query(
      foodItemsRef,
      where('status', '==', status),
      orderBy('expiry_date', 'asc')
    )

    const querySnapshot = await getDocs(q)
    const items: FoodItem[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      items.push({
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate?.() || new Date(data.created_at),
        updated_at: data.updated_at?.toDate?.() || new Date(data.updated_at),
      } as FoodItem)
    })

    return items
  } catch (error) {
    console.error('[Firestore] Error getting items by status:', error)
    throw error
  }
}

/**
 * Get count of food items by status
 * Useful for dashboard statistics
 */
export async function getItemCountByStatus(
  userId: string
): Promise<Record<string, number>> {
  try {
    const allItems = await readAllFoodItems(userId)

    return {
      red: allItems.filter((item) => item.status === 'red').length,
      yellow: allItems.filter((item) => item.status === 'yellow').length,
      green: allItems.filter((item) => item.status === 'green').length,
      total: allItems.length,
    }
  } catch (error) {
    console.error('[Firestore] Error getting item count:', error)
    throw error
  }
}

/**
 * Sync local changes to Firestore
 * For a specific user, update their cloud data
 */
export async function syncUserData(
  userId: string,
  localItems: FoodItem[]
): Promise<void> {
  try {
    // Get current cloud items
    const cloudItems = await readAllFoodItems(userId)
    const cloudIds = new Set(cloudItems.map((i) => i.id))
    const localIds = new Set(localItems.map((i) => i.id))

    // Delete items that are in cloud but not in local
    const toDelete = cloudItems
      .filter((item) => !localIds.has(item.id))
      .map((item) => item.id)

    if (toDelete.length > 0) {
      await batchDeleteFoodItems(userId, toDelete)
    }

    // Upsert items that are in local
    for (const item of localItems) {
      if (cloudIds.has(item.id)) {
        // Update existing
        await updateFoodItem(userId, item.id, {
          product_name: item.product_name,
          expiry_date: item.expiry_date,
          image_url: item.image_url,
          confidence: item.confidence,
        })
      } else {
        // Create new
        await createFoodItem(userId, {
          product_name: item.product_name,
          expiry_date: item.expiry_date,
          image_url: item.image_url,
          confidence: item.confidence,
        })
      }
    }
  } catch (error) {
    console.error('[Firestore] Error syncing user data:', error)
    throw error
  }
}
