import { CARD_STYLES, CAMERA_BUTTON } from '@/styles/themes'

export function WelcomeSection() {
  return (
    <section className={CARD_STYLES.default}>
      <h2 className="text-2xl font-semibold mb-4 text-center">
        歡迎使用 BestBite
      </h2>
      <p className="text-center text-gray-600 mb-6">
        拍攝食品包裝，AI 自動辨識品名與有效期限
      </p>

      {/* Camera button placeholder - will be implemented in Phase 2 */}
      <div className="flex justify-center">
        <button
          className={CAMERA_BUTTON.style}
          style={CAMERA_BUTTON.size}
          disabled
        >
          📷
        </button>
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">
        相機功能開發中...
      </p>
    </section>
  )
}
