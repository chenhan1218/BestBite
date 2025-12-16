'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { FoodItem, InventoryStats } from '@/types'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { loadFromLocal, saveToLocal } from '@/lib/storage'
import { calculateDaysUntilExpiry, getFoodStatus } from '@/lib/date'

interface FoodContextType {
  items: FoodItem[]
  stats: InventoryStats
  loading: boolean
  error: string | null
  refreshItems: () => Promise<void>
}

const FoodContext = createContext<FoodContextType | undefined>(undefined)

export function FoodProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const calculateStats = (foodItems: FoodItem[]): InventoryStats => {
    return foodItems.reduce(
      (acc, item) => {
        acc.total++
        acc[item.status]++
        return acc
      },
      { total: 0, red: 0, yellow: 0, green: 0 }
    )
  }

  const refreshItems = async () => {
    try {
      const localItems = await loadFromLocal()
      setItems(localItems)
    } catch (err) {
      console.error('Error loading items:', err)
    }
  }

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const setupFirestoreListener = async () => {
      try {
        setLoading(true)

        const localItems = await loadFromLocal()
        setItems(localItems)

        const itemsRef = collection(db, 'food_items')
        const q = query(itemsRef, orderBy('created_at', 'desc'))

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const firestoreItems: FoodItem[] = snapshot.docs.map((doc) => {
              const data = doc.data()
              const expiryDate = data.expiry_date
              const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate)
              const status = getFoodStatus(daysUntilExpiry)

              return {
                id: doc.id,
                product_name: data.product_name,
                expiry_date: expiryDate,
                days_until_expiry: daysUntilExpiry,
                status: status,
                image_url: data.image_url,
                confidence: data.confidence,
                created_at: data.created_at?.toDate() || new Date(),
                updated_at: data.updated_at?.toDate() || new Date(),
              }
            })

            setItems(firestoreItems)

            firestoreItems.forEach((item) => {
              saveToLocal(item).catch(console.error)
            })

            setError(null)
          },
          (err) => {
            console.error('Firestore listener error:', err)
            setError('Failed to sync with database')
          }
        )

        setLoading(false)
      } catch (err) {
        console.error('Error setting up Firestore:', err)
        setError('Failed to connect to database')
        setLoading(false)
      }
    }

    setupFirestoreListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  const stats = calculateStats(items)

  return (
    <FoodContext.Provider value={{ items, stats, loading, error, refreshItems }}>
      {children}
    </FoodContext.Provider>
  )
}

export function useFoodContext() {
  const context = useContext(FoodContext)
  if (context === undefined) {
    throw new Error('useFoodContext must be used within a FoodProvider')
  }
  return context
}
