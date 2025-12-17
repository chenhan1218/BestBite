import { CARD_STYLES } from '@/styles/themes'

export function EmptyInventoryPlaceholder() {
  return (
    <div className={CARD_STYLES.default}>
      <p className="text-gray-600 text-center">目前沒有任何庫存項目</p>
      <p className="text-sm text-gray-500 mt-2 text-center">
        請回到首頁使用相機功能新增食品
      </p>
    </div>
  )
}
