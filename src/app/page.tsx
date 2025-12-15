import Link from 'next/link'

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          歡迎使用 BestBite
        </h2>
        <p className="text-center text-gray-600 mb-6">
          拍攝食品包裝，AI 自動辨識品名與有效期限
        </p>

        {/* Camera button placeholder - will be implemented in Phase 2 */}
        <div className="flex justify-center">
          <button
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-full shadow-lg flex items-center gap-3 text-button"
            style={{ width: '80px', height: '80px' }}
            disabled
          >
            📷
          </button>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          相機功能開發中...
        </p>
      </section>

      <section className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-3">快速統計</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-3xl font-bold text-status-red">0</div>
            <div className="text-sm text-gray-600 mt-1">緊急</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-status-yellow">0</div>
            <div className="text-sm text-gray-600 mt-1">注意</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-status-green">0</div>
            <div className="text-sm text-gray-600 mt-1">安全</div>
          </div>
        </div>
      </section>

      <section className="text-center">
        <Link
          href="/inventory"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow text-lg"
        >
          查看完整庫存 →
        </Link>
      </section>
    </div>
  )
}
