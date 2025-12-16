'use client'

import Link from 'next/link'
import { useFoodContext } from '@/context/FoodContext'
import FoodItemCard from '@/components/Inventory/FoodItemCard'
import { FoodItem } from '@/types'

export default function InventoryPage() {
  const { items, loading, error } = useFoodContext()

  // Sort items by status (red first, then yellow, then green) and expiry date
  const sortedItems = [...items].sort((a, b) => {
    // Status priority: red = 0, yellow = 1, green = 2
    const statusPriority = { red: 0, yellow: 1, green: 2 }
    const statusDiff = statusPriority[a.status] - statusPriority[b.status]

    if (statusDiff !== 0) {
      return statusDiff
    }

    // Within same status, sort by expiry date (earliest first)
    return a.days_until_expiry - b.days_until_expiry
  })

  // Group items by status
  const groupedItems = {
    red: sortedItems.filter(item => item.status === 'red'),
    yellow: sortedItems.filter(item => item.status === 'yellow'),
    green: sortedItems.filter(item => item.status === 'green'),
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Food Inventory</h2>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Food Inventory</h2>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 text-center">
          <p className="text-red-900 font-semibold">Error loading inventory</p>
          <p className="text-sm text-red-700 mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Food Inventory</h2>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-semibold"
          >
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="w-24 h-24 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-gray-600 text-lg">No items in inventory</p>
          <p className="text-sm text-gray-500 mt-2">
            Return to home page to add food items using camera
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Food Inventory</h2>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          Back to Home
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Urgent</p>
            <p className="text-2xl font-bold text-red-600">{groupedItems.red.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Warning</p>
            <p className="text-2xl font-bold text-yellow-600">{groupedItems.yellow.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Safe</p>
            <p className="text-2xl font-bold text-green-600">{groupedItems.green.length}</p>
          </div>
        </div>
      </div>

      {/* Urgent Items (Red) */}
      {groupedItems.red.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Urgent - Expiring Soon
          </h3>
          {groupedItems.red.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Warning Items (Yellow) */}
      {groupedItems.yellow.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-yellow-600 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Warning - Check Soon
          </h3>
          {groupedItems.yellow.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Safe Items (Green) */}
      {groupedItems.green.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-green-600 flex items-center gap-2">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Safe - Fresh Items
          </h3>
          {groupedItems.green.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
