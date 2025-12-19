'use client'

import { useState } from 'react'
import type { FoodItem } from '@/types'
import { FoodItemCard } from './FoodItemCard'

interface FoodListProps {
  items: FoodItem[]
  onDelete: (id: string) => Promise<void>
  isDeletingId?: string
}

interface GroupedItems {
  red: FoodItem[]
  yellow: FoodItem[]
  green: FoodItem[]
}

export function FoodList({
  items,
  onDelete,
  isDeletingId,
}: FoodListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(isDeletingId || null)

  // Group items by status
  const grouped: GroupedItems = {
    red: [],
    yellow: [],
    green: [],
  }

  for (const item of items) {
    grouped[item.status].push(item)
  }

  // Handle delete with loading state
  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Red Zone - Urgent */}
      {grouped.red.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-red-700 mb-4 flex items-center gap-2">
            🔴 即將過期 ({grouped.red.length})
          </h2>
          <div className="space-y-3 bg-red-50 rounded-lg p-4 border-2 border-red-200">
            {grouped.red.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Yellow Zone - Attention */}
      {grouped.yellow.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-yellow-700 mb-4 flex items-center gap-2">
            🟡 需要留意 ({grouped.yellow.length})
          </h2>
          <div className="space-y-3 bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
            {grouped.yellow.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Green Zone - Safe */}
      {grouped.green.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
            🟢 安心存放 ({grouped.green.length})
          </h2>
          <div className="space-y-3 bg-green-50 rounded-lg p-4 border-2 border-green-200">
            {grouped.green.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                isDeleting={deletingId === item.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-2xl mb-2">📭 清單是空的</p>
          <p className="text-gray-600">拍攝食品包裝開始新增項目</p>
        </div>
      )}
    </div>
  )
}
