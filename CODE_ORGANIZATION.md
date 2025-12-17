# 📁 BestBite 代碼組織指南

**目的：** 幫助開發者快速理解代碼結構、查找特定功能、遵循編碼規範

**Last Updated：** 2025-12-17
**Audience：** 所有開發者

---

## 🏗️ 項目結構概覽

```
bestbite/
├── 📄 配置文件
│   ├── package.json           # 依賴和腳本
│   ├── tsconfig.json          # TypeScript 配置
│   ├── tailwind.config.ts     # Tailwind 配置
│   ├── next.config.js         # Next.js + PWA 配置
│   └── jest.config.js         # Jest 測試配置
│
├── 📂 src/
│   ├── app/                   # Next.js App Router 頁面
│   │   ├── page.tsx           # 首頁 (/)
│   │   ├── layout.tsx         # 根佈局（全局 CSS、Header）
│   │   ├── globals.css        # Tailwind 全局樣式
│   │   ├── inventory/page.tsx # 清單頁面 (/inventory)
│   │   └── api/
│   │       └── gemini/route.ts  # Gemini API 代理 (/api/gemini)
│   │
│   ├── components/            # React 元件
│   │   ├── Home/              # 首頁元件
│   │   │   ├── index.tsx      # 導出點
│   │   │   ├── WelcomeSection.tsx
│   │   │   ├── StatisticsSection.tsx
│   │   │   ├── StatisticsCard.tsx
│   │   │   └── ViewFullInventorySection.tsx
│   │   ├── Inventory/         # 清單頁面元件
│   │   │   ├── index.tsx
│   │   │   └── EmptyInventoryPlaceholder.tsx
│   │   └── Shared/            # 跨項目通用元件
│   │       ├── index.tsx
│   │       └── BackToHomeLink.tsx
│   │
│   ├── lib/                   # 業務邏輯和工具函數
│   │   ├── firebase.ts        # Firebase 初始化和配置
│   │   ├── firestore.ts       # Firestore CRUD 操作
│   │   ├── gemini.ts          # Gemini API 工具函數
│   │   ├── storage.ts         # IndexedDB 本地存儲
│   │   ├── date.ts            # 日期計算和格式化
│   │   ├── image.ts           # 圖片壓縮和驗證
│   │   └── __tests__/         # 單元測試
│   │       ├── date.test.ts
│   │       ├── firebase.test.ts
│   │       ├── gemini.test.ts
│   │       ├── firestore.test.ts
│   │       └── storage.test.ts
│   │
│   ├── types/                 # TypeScript 類型定義
│   │   └── index.ts           # 集中式類型文件
│   │
│   ├── context/               # React Context（規劃中）
│   │   └── FoodContext.tsx
│   │
│   ├── hooks/                 # 自定義 React Hooks（規劃中）
│   │   ├── useFoodItems.ts
│   │   └── useCamera.ts
│   │
│   └── styles/                # 設計系統和常數
│       └── themes.ts          # Tailwind 樣式常數
│
├── 📂 public/
│   ├── manifest.json          # PWA manifest
│   ├── icons/                 # PWA 圖標
│   └── images/                # 靜態圖片
│
└── 📄 文檔文件
    ├── CLAUDE.md              # Claude Code 工作模式
    ├── PROJECT_PLAN.md        # 產品規劃和需求
    ├── ARCHITECTURE.md        # 系統架構
    ├── DESIGN_DECISIONS.md    # 設計決策（新）
    ├── CODE_ORGANIZATION.md   # 本文件
    ├── IMPLEMENTATION_PLAN.md # 實現計劃
    ├── DEVELOPMENT_GUIDE.md   # 開發環境設置
    ├── CHECKLIST.md           # 進度檢查清單
    └── README.md              # 項目簡介
```

---

## 🎯 快速導航：找到你需要的代碼

### 我想... → 去這個文件

| 任務 | 文件位置 | 說明 |
|------|---------|------|
| 添加新頁面 | `src/app/{name}/page.tsx` | 使用 Next.js App Router |
| 創建 UI 元件 | `src/components/{Category}/Component.tsx` | 功能型 → 目錄，通用 → Shared |
| 修改樣式 | `src/styles/themes.ts` | 修改常數，然後在元件中導入 |
| 添加業務邏輯 | `src/lib/` (新增 .ts) | Pure functions，便於測試 |
| 定義類型 | `src/types/index.ts` | 集中式，便於同步 |
| 添加單元測試 | `src/lib/__tests__/feature.test.ts` | Jest + Mocks |
| Firebase 配置 | `src/lib/firebase.ts` | 初始化和工具 |
| Firestore 操作 | `src/lib/firestore.ts` | CRUD 函數 |
| 圖片處理 | `src/lib/image.ts` | 壓縮、驗證 |
| 日期計算 | `src/lib/date.ts` | 狀態判斷、格式化 |
| 離線存儲 | `src/lib/storage.ts` | IndexedDB 操作 |
| Gemini API | `src/lib/gemini.ts` | API 工具函數 |
| Gemini 路由 | `src/app/api/gemini/route.ts` | 後端 API 代理 |

---

## 📋 各模塊詳解

### 1. Pages (`src/app/`)

#### 特徵
- **文件 = 路由** - `app/inventory/page.tsx` → `/inventory`
- **Layout 自動繼承** - 使用根 `layout.tsx`
- **Server Component 優先** - 除非需要交互，否則保持 Server Component

#### 文件列表

| 文件 | 路由 | 功能 | 實現狀態 |
|------|------|------|---------|
| `page.tsx` | `/` | 首頁 - 相機 + 統計 | ✅ 完成 |
| `inventory/page.tsx` | `/inventory` | 清單頁面 | ✅ 完成（空狀態）|
| `layout.tsx` | 全局 | Header + 容器 | ✅ 完成 |
| `api/gemini/route.ts` | `/api/gemini` | Gemini API 代理 | 🔄 規劃中 |

#### 命名規範
- 文件名全小寫：`page.tsx`, `layout.tsx`, `route.ts`
- 目錄名全小寫：`inventory`, `api`

---

### 2. Components (`src/components/`)

#### 架構
```
components/
├── {Category}/           # 按功能分類
│   ├── index.tsx        # 導出點
│   ├── Component1.tsx   # 具體實現
│   └── Component2.tsx
├── Shared/              # 跨功能通用
│   └── ...
└── Common/              # 非常通用（如 Loading）
    └── ...
```

#### 設計原則
- **純展示** - 元件只負責 UI，邏輯在 `lib/` 或 hooks
- **無副作用** - 不直接呼叫 API，使用 props 傳遞
- **易於測試** - 接受簡單 props，便於 mock
- **Tailwind 常數化** - 從 `themes.ts` 導入，不內聯類別

#### 示例：StatisticsCard.tsx

```typescript
import { STATUS_COLORS, TEXT_SIZES } from '@/styles/themes'

interface StatisticsCardProps {
  status: 'red' | 'yellow' | 'green'
  count: number
  label: string
}

export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  status,
  count,
  label,
}) => {
  const colors = STATUS_COLORS[status]

  return (
    <div className={`${colors.bg} ${colors.border}`}>
      <div className={TEXT_SIZES.cardTitle}>
        {count}
      </div>
      <p className={colors.text}>{label}</p>
    </div>
  )
}
```

#### 命名規範
- 文件名 PascalCase：`StatisticsCard.tsx`
- 導出時保持相同名稱
- Props 接口：`{ComponentName}Props`

---

### 3. Business Logic (`src/lib/`)

#### 特徵
- **Pure Functions** - 無副作用，易於測試
- **零依賴** - 不導入 React，可在 Node.js 中運行
- **單一責任** - 每個文件專注一個功能

#### 模塊概覽

**firebase.ts** (Firebase 初始化)
```typescript
// 功能
- initializeFirebase()        // 檢查初始化
- getOrCreateUserID()         // UUID 管理
- validateFirebaseConfig()    // 配置驗證

// 導出
export { auth, db, storage }
```

**firestore.ts** (CRUD 操作)
```typescript
// 創建
export async function createFoodItem(
  userId: string,
  input: CreateFoodItemInput
): Promise<FoodItem>

// 讀取
export async function readAllFoodItems(
  userId: string,
  filters?: { status?: Status }
): Promise<FoodItem[]>

// 更新（會重新計算 days_until_expiry）
export async function updateFoodItem(
  userId: string,
  itemId: string,
  updates: Partial<UpdateFoodItemInput>
): Promise<FoodItem>

// 刪除（同時刪除 Storage 中的圖片）
export async function deleteFoodItem(
  userId: string,
  itemId: string
): Promise<void>

// 圖片操作
export async function uploadImageToStorage(
  userId: string,
  itemId: string,
  file: File
): Promise<string>  // 返回 image_url

export async function deleteImageFromStorage(
  imageUrl: string
): Promise<void>
```

**gemini.ts** (Gemini API 工具)
```typescript
// 類型定義
interface GeminiResponse {
  product_name: string
  expiry_date: string       // YYYY-MM-DD
  confidence: number        // 0-100
  notes?: string
}

// 工具函數
export function parseGeminiResponse(response: unknown): GeminiResponse
export function isValidGeminiResponse(obj: unknown): boolean
export function formatConfidence(score: number): string

// 提示詞
export const FOOD_RECOGNITION_PROMPT = `...`
```

**storage.ts** (IndexedDB)
```typescript
// 初始化
export async function initStorage(): Promise<void>

// CRUD
export async function getAllFoodItems(): Promise<FoodItem[]>
export async function getFoodItemsByStatus(
  status: Status
): Promise<FoodItem[]>
export async function addFoodItem(item: FoodItem): Promise<void>
export async function updateFoodItem(
  id: string,
  updates: Partial<FoodItem>
): Promise<void>
export async function deleteFoodItem(id: string): Promise<void>

// 同步追蹤
export async function getLastSyncTime(): Promise<number>
export async function setLastSyncTime(timestamp: number): Promise<void>
```

**date.ts** (日期邏輯)
```typescript
// 計算
export function calculateDaysUntilExpiry(expiryDate: string): number
export function getFoodStatus(daysUntilExpiry: number): Status
export function isExpired(expiryDate: string): boolean

// 格式化（繁體中文）
export function formatDateChinese(dateString: string): string
export function formatDateISO(date: Date): string
export function getExpiryMessage(daysUntilExpiry: number): string

// 排序
export function sortByExpiryDate<T extends { expiry_date: string }>(
  items: T[]
): T[]  // 非破壞性排序
```

**image.ts** (圖片處理)
```typescript
// 驗證
export function validateImage(file: File): ValidationResult
export function getImagePreview(file: File): Promise<string>

// 壓縮
export function compressImage(
  file: File,
  maxSizeKB: number = 1500
): Promise<Blob>

// 轉換
export async function fileToBase64(file: File): Promise<string>

// 大小調整
export function resizeImage(
  file: File,
  width: number,
  height: number
): Promise<Blob>
```

#### 命名規範
- 文件名 camelCase：`firebase.ts`, `gemini.ts`
- 函數名 camelCase：`calculateDaysUntilExpiry()`
- 常數 UPPER_SNAKE_CASE：`FOOD_RECOGNITION_PROMPT`
- 接口 PascalCase：`FoodItem`, `GeminiResponse`

---

### 4. Types (`src/types/index.ts`)

#### 集中式類型定義

```typescript
// 主要數據模型
interface FoodItem {
  id: string
  product_name: string
  expiry_date: string       // YYYY-MM-DD
  days_until_expiry: number
  status: 'red' | 'yellow' | 'green'
  image_url: string
  confidence: number        // 0-100
  created_at: Date
  updated_at: Date
}

// API 請求/回應
interface CreateFoodItemInput {
  product_name: string
  expiry_date: string
  image_url?: string
  confidence?: number
}

interface UpdateFoodItemInput {
  product_name?: string
  expiry_date?: string
  image_url?: string
}

// Gemini API
interface GeminiResponse {
  product_name: string
  expiry_date: string
  confidence: number
  notes?: string
}

// 狀態類型
type Status = 'red' | 'yellow' | 'green'
```

#### 命名規範
- 接口 PascalCase：`FoodItem`, `GeminiResponse`
- 泛型 Type 後綴：`Input`, `Output`, `Props`
- 常數類型：`as const`

---

### 5. Styles (`src/styles/themes.ts`)

#### 目的
集中管理 Tailwind 樣式常數，便於：
- 全局主題切換（未來）
- 避免樣式散佈
- 一致的設計系統

#### 示例

```typescript
export const STATUS_COLORS = {
  red: {
    bg: 'bg-red-50',
    border: 'border-2 border-red-500',
    text: 'text-red-900',
    icon: '🔴'
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-2 border-yellow-500',
    text: 'text-yellow-900',
    icon: '🟡'
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-2 border-green-500',
    text: 'text-green-900',
    icon: '🟢'
  }
}

export const TEXT_SIZES = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  cardTitle: 'text-3xl font-bold',
  pageTitle: 'text-4xl font-bold'
}

export const BUTTON_STYLES = {
  primary: 'bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300',
  danger: 'bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700'
}

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px'
}
```

---

## 🔄 編碼工作流

### 1. 添加新功能的步驟

```
1. 定義類型
   └─ src/types/index.ts (添加 interface)

2. 實現業務邏輯
   └─ src/lib/feature.ts (純 functions)

3. 編寫測試
   └─ src/lib/__tests__/feature.test.ts

4. 創建 UI 元件
   └─ src/components/{Category}/Component.tsx

5. 集成到頁面
   └─ src/app/page.tsx

6. 測試整個流程
   └─ npm run dev

7. 驗證和提交
   └─ npm run lint && npm run test && git commit
```

### 2. 命名檢查清單

在提交前，檢查：
- [ ] 文件名 PascalCase（元件）或 camelCase（工具）
- [ ] 函數名 camelCase：`calculateDaysUntilExpiry()`
- [ ] 常數 UPPER_SNAKE_CASE：`MAX_IMAGE_SIZE`
- [ ] 接口 PascalCase：`CreateFoodItemInput`
- [ ] 目錄名全小寫：`components`, `lib`

### 3. 代碼檢查

```bash
# 檢查 lint
npm run lint

# 自動修復
npm run lint:fix

# 運行測試
npm test

# 類型檢查（測試中自動進行）
npx tsc --noEmit
```

---

## 🎨 樣式和主題

### 使用 Tailwind 常數

❌ **不要**：內聯 Tailwind 類
```typescript
<div className="bg-red-50 border-2 border-red-500 text-red-900">
```

✅ **要**：從 themes.ts 導入
```typescript
import { STATUS_COLORS } from '@/styles/themes'

<div className={`${STATUS_COLORS.red.bg} ${STATUS_COLORS.red.border}`}>
```

### 添加新主題

如需新顏色/樣式，添加到 `src/styles/themes.ts`：

```typescript
export const NEW_COMPONENT_STYLES = {
  bg: 'bg-blue-100',
  text: 'text-blue-900',
  // ...
}
```

然後在元件中使用：
```typescript
import { NEW_COMPONENT_STYLES } from '@/styles/themes'
```

---

## 📝 文檔引用

如果你想了解更多，查看：
- **架構決策** → `DESIGN_DECISIONS.md`
- **測試策略** → `TESTING_STRATEGY.md`（待創建）
- **離線支援** → `OFFLINE_STRATEGY.md`（待創建）
- **升級路線圖** → `PHASE_2_ROADMAP.md`（待創建）
- **系統設計** → `ARCHITECTURE.md`

---

## 🆘 常見問題

**Q: 我想修改紅/黃/綠顏色，去哪裡改？**
A: `src/styles/themes.ts` 的 `STATUS_COLORS` 物件

**Q: 新增頁面應該在哪裡？**
A: 在 `src/app/` 下創建新目錄，添加 `page.tsx`

**Q: 可以在元件中直接呼叫 Firebase 嗎？**
A: 不可以。應將邏輯放在 `src/lib/` 的函數中，元件只負責 UI

**Q: 測試怎麼寫？**
A: 參考 `src/lib/__tests__/date.test.ts`，使用 Jest + mock

**Q: 怎麼添加新類型？**
A: 在 `src/types/index.ts` 添加 interface，然後全項目導入

---

**最後更新者：** Claude Code (架構師)
**最後更新日期：** 2025-12-17
