import { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db, uploadImage, deleteImage, generateImagePath } from '@/lib/firebase'
import { saveToLocal, deleteFromLocal } from '@/lib/storage'
import { calculateDaysUntilExpiry, getFoodStatus } from '@/lib/date'
import { FoodItem, FoodItemInput } from '@/types'

export function useFoodItems() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addFoodItem = async (
    productName: string,
    expiryDate: string,
    imageFile: File | Blob,
    confidence: number
  ): Promise<FoodItem | null> => {
    setLoading(true)
    setError(null)

    try {
      const tempId = `temp_${Date.now()}`
      const imagePath = generateImagePath(tempId, 'photo.jpg')

      const imageUrl = await uploadImage(imageFile, imagePath)

      const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate)
      const status = getFoodStatus(daysUntilExpiry)

      const foodData: FoodItemInput = {
        product_name: productName,
        expiry_date: expiryDate,
        image_url: imageUrl,
        confidence: confidence,
      }

      const docRef = await addDoc(collection(db, 'food_items'), {
        ...foodData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })

      const newItem: FoodItem = {
        id: docRef.id,
        ...foodData,
        days_until_expiry: daysUntilExpiry,
        status: status,
        created_at: new Date(),
        updated_at: new Date(),
      }

      await saveToLocal(newItem)

      console.log('Food item added successfully:', newItem.id)
      setLoading(false)
      return newItem

    } catch (err) {
      console.error('Error adding food item:', err)
      setError(err instanceof Error ? err.message : 'Failed to add food item')
      setLoading(false)
      return null
    }
  }

  const updateFoodItem = async (
    id: string,
    updates: Partial<FoodItemInput>
  ): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const docRef = doc(db, 'food_items', id)

      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      })

      console.log('Food item updated successfully:', id)
      setLoading(false)
      return true

    } catch (err) {
      console.error('Error updating food item:', err)
      setError(err instanceof Error ? err.message : 'Failed to update food item')
      setLoading(false)
      return false
    }
  }

  const deleteFoodItem = async (id: string, imageUrl: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      if (imageUrl) {
        await deleteImage(imageUrl).catch(console.error)
      }

      const docRef = doc(db, 'food_items', id)
      await deleteDoc(docRef)

      await deleteFromLocal(id)

      console.log('Food item deleted successfully:', id)
      setLoading(false)
      return true

    } catch (err) {
      console.error('Error deleting food item:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete food item')
      setLoading(false)
      return false
    }
  }

  return {
    addFoodItem,
    updateFoodItem,
    deleteFoodItem,
    loading,
    error,
  }
}
