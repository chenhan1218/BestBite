'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FoodItem } from '@/types'
import { formatDateChinese, getExpiryMessage } from '@/lib/date'
import { useFoodItems } from '@/hooks/useFoodItems'

interface FoodItemCardProps {
  item: FoodItem
}

export default function FoodItemCard({ item }: FoodItemCardProps) {
  const { deleteFoodItem } = useFoodItems()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${item.product_name}"?`)) {
      return
    }

    setDeleting(true)
    const success = await deleteFoodItem(item.id, item.image_url)

    if (!success) {
      alert('Delete failed. Please try again.')
      setDeleting(false)
    }
  }

  const statusColors = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-400',
      text: 'text-red-900',
      badge: 'bg-red-500',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
      badge: 'bg-yellow-500',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      text: 'text-green-900',
      badge: 'bg-green-500',
    },
  }

  const colors = statusColors[item.status]
  const isUrgent = item.status === 'red'

  return (
    <div
      className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 ${
        isUrgent ? 'shadow-lg' : 'shadow'
      } ${deleting ? 'opacity-50' : ''}`}
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
          <Image
            src={item.image_url}
            alt={item.product_name}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`${colors.text} font-semibold ${isUrgent ? 'text-xl' : 'text-lg'} truncate`}>
              {item.product_name}
            </h3>
            <span className={`${colors.badge} text-white text-xs px-2 py-1 rounded-full whitespace-nowrap`}>
              {item.status === 'red' && 'Urgent'}
              {item.status === 'yellow' && 'Warning'}
              {item.status === 'green' && 'Safe'}
            </span>
          </div>

          <p className={`${colors.text} text-sm mt-1`}>
            Expiry: {formatDateChinese(item.expiry_date)}
          </p>

          <p className={`${colors.text} font-medium text-sm mt-1`}>
            {getExpiryMessage(item.days_until_expiry)}
          </p>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-2 text-xs text-gray-600 hover:text-red-600 underline disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
