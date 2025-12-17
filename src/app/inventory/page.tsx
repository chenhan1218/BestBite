import { EmptyInventoryPlaceholder, BackToHomeLink } from '@/components'

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">食品庫存</h2>
        <BackToHomeLink />
      </div>

      <EmptyInventoryPlaceholder />
    </div>
  )
}
