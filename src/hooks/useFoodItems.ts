import { useState, useCallback } from 'react'
import { useFoodContext } from '@/context/FoodContext'
import type { FoodItem, GeminiResponse } from '@/types'
import { compressImage, fileToBase64 } from '@/lib/image'

interface UseFoodItemsOptions {
  onSuccess?: (item: FoodItem) => void
  onError?: (error: Error) => void
}

export function useFoodItems(options?: UseFoodItemsOptions) {
  const context = useFoodContext()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processError, setProcessError] = useState<string | null>(null)

  // Add food item with AI recognition
  const addFoodItemWithAI = useCallback(
    async (imageFile: File, userConfirmation?: { product_name: string; expiry_date: string }) => {
      try {
        setIsProcessing(true)
        setProcessError(null)

        // Compress image
        const compressedFile = await compressImage(imageFile)
        const base64Image = await fileToBase64(compressedFile)

        // Call Gemini API
        const response = await fetch('/api/gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_data: base64Image,
            mime_type: compressedFile.type,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to call Gemini API')
        }

        const geminiResponse: GeminiResponse = await response.json()

        // Use user-provided data if available, otherwise use Gemini response
        const finalData = {
          product_name: userConfirmation?.product_name || geminiResponse.product_name,
          expiry_date: userConfirmation?.expiry_date || geminiResponse.expiry_date,
          image_url: '', // Will be set by addItem
          confidence: geminiResponse.confidence,
        }

        // Add to context
        const newItem = await context.addItem(compressedFile, finalData)

        if (options?.onSuccess) {
          options.onSuccess(newItem)
        }

        return newItem
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        setProcessError(error.message)

        if (options?.onError) {
          options.onError(error)
        }

        throw error
      } finally {
        setIsProcessing(false)
      }
    },
    [context, options]
  )

  // Update existing food item
  const updateFoodItem = useCallback(
    async (
      id: string,
      data: {
        product_name?: string
        expiry_date?: string
      }
    ) => {
      try {
        setProcessError(null)
        await context.updateItem(id, data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        setProcessError(error.message)
        throw error
      }
    },
    [context]
  )

  // Delete food item
  const deleteFoodItem = useCallback(
    async (id: string) => {
      try {
        setProcessError(null)
        await context.deleteItem(id)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred')
        setProcessError(error.message)
        throw error
      }
    },
    [context]
  )

  // Get food items (with optional filtering)
  const getFoodItems = useCallback(
    (filter?: 'all' | 'red' | 'yellow' | 'green') => {
      switch (filter) {
        case 'red':
          return context.redItems
        case 'yellow':
          return context.yellowItems
        case 'green':
          return context.greenItems
        default:
          return context.items
      }
    },
    [context.items, context.redItems, context.yellowItems, context.greenItems]
  )

  return {
    // State
    items: context.items,
    loading: context.loading,
    error: context.error || processError,
    isProcessing,

    // Statistics
    redItems: context.redItems,
    yellowItems: context.yellowItems,
    greenItems: context.greenItems,
    totalItems: context.totalItems,

    // Operations
    addFoodItemWithAI,
    updateFoodItem,
    deleteFoodItem,
    getFoodItems,
    refreshItems: context.refreshItems,
  }
}
