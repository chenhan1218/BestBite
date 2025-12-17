/**
 * 統一樣式常量管理
 * 便於未來主題切換、樣式系統遷移（Tailwind → CSS-in-JS）
 */

// 過期狀態顏色與樣式
export const STATUS_COLORS = {
  red: {
    bg: 'bg-red-50',
    text: 'text-status-red',
    border: 'border-red-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-status-yellow',
    border: 'border-yellow-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-status-green',
    border: 'border-green-200',
  },
} as const

// 基礎按鈕樣式
export const BUTTON_STYLES = {
  primary: 'bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg',
  secondary: 'bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow',
  link: 'text-blue-600 hover:text-blue-800 font-semibold',
} as const

// Card 與 Section 樣式
export const CARD_STYLES = {
  default: 'bg-white rounded-lg shadow-md p-6',
  compact: 'bg-white rounded-lg shadow-md p-4',
} as const

// 間距與排版
export const SPACING = {
  section: 'space-y-6',
  container: 'container mx-auto px-4 py-6 max-w-2xl',
  grid3: 'grid grid-cols-3 gap-4',
} as const

// 文字大小
export const TEXT_SIZES = {
  title: 'text-4xl',
  heading: 'text-2xl',
  subheading: 'text-xl',
  body: 'text-base',
  small: 'text-sm',
  button: 'text-2xl',
} as const

// 統計卡片尺寸
export const STATISTICS_CARD = {
  number: 'text-3xl font-bold',
  label: 'text-sm text-gray-600 mt-1',
} as const

// 相機按鈕
export const CAMERA_BUTTON = {
  size: { width: '80px', height: '80px' },
  style: 'bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-lg flex items-center gap-3',
} as const
