'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import type { FoodItem } from '@/types'
import { STATUS_COLORS } from '@/styles/themes'
import { formatDateChinese } from '@/lib/date'

interface FoodItemCardProps {
  item: FoodItem
  onDelete: (id: string) => Promise<void>
  isDeleting?: boolean
}

export function FoodItemCard({
  item,
  onDelete,
  isDeleting = false,
}: FoodItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting_, setIsDeleting_] = useState(false)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [touchStartX, setTouchStartX] = useState(0)
  const [translateX, setTranslateX] = useState(0)

  const statusColor = STATUS_COLORS[item.status]

  // Handle long press for delete
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)

    longPressTimer.current = setTimeout(() => {
      setShowDeleteConfirm(true)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  // Handle swipe to delete
  const handleTouchMove = (e: React.TouchEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }

    const currentX = e.touches[0].clientX
    const diff = currentX - touchStartX

    // Only allow swipe left
    if (diff < 0) {
      setTranslateX(Math.max(diff, -80))
    }
  }

  const handleDeleteClick = async () => {
    setIsDeleting_(true)
    try {
      await onDelete(item.id)
    } catch (err) {
      console.error('Failed to delete item:', err)
    } finally {
      setIsDeleting_(false)
      setShowDeleteConfirm(false)
    }
  }

  // Format date display
  const formattedDate = formatDateChinese(item.expiry_date)
  const statusEmoji = item.status === 'red' ? '🔴' : item.status === 'yellow' ? '🟡' : '🟢'

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className="relative overflow-hidden"
      >
        {/* Delete button (visible on swipe) */}
        <div className="absolute right-0 top-0 bottom-0 bg-red-600 flex items-center justify-end px-4 z-0">
          <button
            onClick={handleDeleteClick}
            disabled={isDeleting_ || isDeleting}
            className="text-white font-semibold disabled:opacity-50"
            type="button"
          >
            {isDeleting_ ? '刪除中...' : '刪除'}
          </button>
        </div>

        {/* Card content */}
        <div
          style={{ transform: `translateX(${translateX}px)` }}
          className="transition-transform duration-200 bg-white rounded-lg shadow-md p-4 flex gap-4 cursor-pointer hover:shadow-lg"
        >
          {/* Image thumbnail */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <Image
              src={item.image_url}
              alt={item.product_name}
              fill
              className="object-cover rounded-lg"
              sizes="80px"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header with status */}
            <div className="flex items-start gap-2 mb-2">
              <span className="text-xl flex-shrink-0">{statusEmoji}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-800 truncate">
                  {item.product_name}
                </h3>
              </div>
            </div>

            {/* Date info */}
            <div className="space-y-1 text-sm text-gray-600">
              <p>📅 {formattedDate}</p>
              <p
                className={`font-semibold ${
                  item.status === 'red'
                    ? 'text-red-700'
                    : item.status === 'yellow'
                      ? 'text-yellow-700'
                      : 'text-green-700'
                }`}
              >
                {item.status === 'red' && `⏰ ${item.days_until_expiry} 天內要吃！`}
                {item.status === 'yellow' && `⏰ 還有 ${item.days_until_expiry} 天`}
                {item.status === 'green' && `✓ 還有 ${item.days_until_expiry} 天`}
              </p>
            </div>

            {/* Confidence badge */}
            <div className="mt-2 text-xs text-gray-500">
              AI 信心度: {Math.round(item.confidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-lg p-6 space-y-4">
            <h3 className="text-lg font-bold">確認刪除?</h3>
            <p className="text-gray-600">
              將刪除 <span className="font-semibold">{item.product_name}</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting_}
                className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
                type="button"
              >
                取消
              </button>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting_ || isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                type="button"
              >
                {isDeleting_ ? '刪除中...' : '確認刪除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
