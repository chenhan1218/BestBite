import Link from 'next/link'

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">食品庫存</h2>
        <Link
          href="/"
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← 返回首頁
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <p className="text-gray-600">目前沒有任何庫存項目</p>
        <p className="text-sm text-gray-500 mt-2">
          請回到首頁使用相機功能新增食品
        </p>
      </div>
    </div>
  )
}
