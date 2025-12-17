# BestBite 實現計劃 - 詳細架構

**Last Updated:** 2025-12-17
**Status:** Ready for Implementation
**Branch:** `claude/plan-next-steps-skFEU`

---

## 📋 架構決策 (Locked)

| 決策 | 方案 | 理由 |
|------|------|------|
| **身份認證** | 無帳號模式 | MVP 優先，減少複雜度；後續可升級為 optional Firebase Auth |
| **資料同步** | 雲優先 (Firestore) | 可靠、實時、支援離線後同步 |
| **本地存儲** | IndexedDB 緩存層 | 離線支援，提升響應速度 |
| **圖片存儲** | Firebase Storage | 統一管理，支援分享、版本控制 |
| **狀態管理** | React Context API | 無帳號模式無複雜跨裝置同步需求 |
| **API 路由** | Next.js Route Handler | 伺服器端調用 Gemini，隱藏 API Key |
| **測試策略** | Mock Gemini + 單元測試商業邏輯 | 避免 API 配額浪費，專注測試決策邏輯 |

---

## 🏗️ 分層架構

```
┌─────────────────────────────────────────┐
│         UI Components (React)             │
│  (Camera, Inventory, Modal, Header)      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│    Context + Hooks (Business Logic)      │
│  (FoodContext, useFoodItems, useImage)  │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Async Services (Data Layer)         │
│  (firebase.ts, gemini.ts, storage.ts)   │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│   External Services (Firestore, Gemini)  │
│    + IndexedDB (Offline Cache)           │
└─────────────────────────────────────────┘
```

---

## 📁 實現優先級 (4 個階段)

### **階段 1️⃣: 基礎設施 (無用戶界面依賴)**

#### 1.1 Firebase 初始化 (`src/lib/firebase.ts`)
**目的：** 統一的 Firebase 實例、初始化配置

```typescript
// 函數簽名
export const firebase: FirebaseApp                    // 單例
export const db: Firestore                           // Firestore 實例
export const storage: FirebaseStorage                // Storage 實例

export function getOrCreateUserID(): string          // Local Storage 生成 UUID
export async function initializeFirebase(): Promise<void>  // 初始化檢查
```

**關鍵決策：**
- 無帳號模式 → 本地生成 UUID，存入 LocalStorage
- 所有資料存於 `users/{userId}/food_items/`
- 圖片存於 `gs://bucket/users/{userId}/images/{itemId}.jpg`

**依賴檢查清單：**
- [ ] `.env.local` 中有效的 Firebase credentials

**測試方式：** 單元測試（mock Firebase）

---

#### 1.2 IndexedDB 緩存層 (`src/lib/storage.ts`)
**目的：** 離線支援、快速本地查詢

```typescript
// 資料庫結構
interface StorageSchema {
  foodItems: FoodItem[]
  lastSyncTimestamp: number
  pendingUploads: Array<{id: string, status: 'pending'}>
}

// 函數簽名
export async function initStorage(): Promise<void>
export async function getAllFoodItems(): Promise<FoodItem[]>
export async function addFoodItem(item: FoodItem): Promise<void>
export async function updateFoodItem(id: string, partial: Partial<FoodItem>): Promise<void>
export async function deleteFoodItem(id: string): Promise<void>
export async function clearAllItems(): Promise<void>
export async function getLastSyncTime(): Promise<number>
export async function setLastSyncTime(timestamp: number): Promise<void>
```

**離線同步策略：**
1. 用戶操作 → 先寫入 IndexedDB（立即回應）
2. 後台非同步上傳至 Firestore
3. 連線恢復時自動同步 pending items

**測試方式：** IndexedDB mock + async 測試

---

#### 1.3 Firestore CRUD 操作 (`src/lib/firestore.ts`)
**目的：** 封裝 Firestore 的所有資料庫操作

```typescript
// 函數簽名
export async function createFoodItem(userId: string, item: FoodItemInput): Promise<string>
  // 返回 itemId (Firestore auto-generated)

export async function readFoodItem(userId: string, itemId: string): Promise<FoodItem | null>

export async function readAllFoodItems(userId: string): Promise<FoodItem[]>
  // 返回排序後的陣列（按 expiry_date ASC）

export async function updateFoodItem(userId: string, itemId: string, updates: Partial<FoodItemInput>): Promise<void>

export async function deleteFoodItem(userId: string, itemId: string): Promise<void>

export async function uploadImageToStorage(userId: string, itemId: string, file: File): Promise<string>
  // 返回圖片 URL
```

**決策理由：**
- 所有操作前必須檢查 `userId` 有效性
- 圖片上傳與資料庫操作分離（異步獨立）
- Firestore 規則確保只能存取自己的資料

**測試方式：** Firestore emulator 或 mock

---

#### 1.4 圖片處理工具 (`src/lib/image.ts`)
**目的：** 圖片壓縮、預覽、Base64 轉換

```typescript
// 函數簽名
export async function compressImage(file: File, maxSizeKB: number = 1500): Promise<File>
  // 返回壓縮後的 File 對象

export function fileToBase64(file: File): Promise<string>
  // 返回 base64 字符串（用於 Gemini API）

export async function getImagePreview(file: File): Promise<string>
  // 返回縮小版本的 data URL（用於 UI 預覽）
```

**關鍵限制：**
- 最終上傳大小 < 2MB
- 圖片格式限制：JPEG, PNG, WebP

**測試方式：** Canvas mock + 單元測試

---

### **階段 2️⃣: 業務邏輯層 (Context + Hooks)**

#### 2.1 FoodContext (`src/context/FoodContext.tsx`)
**目的：** 全局狀態管理（無帳號模式下單一用戶）

```typescript
interface FoodContextValue {
  // 狀態
  items: FoodItem[]
  stats: InventoryStats
  loading: boolean
  error: string | null

  // Actions
  addItem: (item: FoodItem) => void
  updateItem: (id: string, updates: Partial<FoodItem>) => void
  deleteItem: (id: string) => void
  refreshItems: () => Promise<void>
  clearError: () => void

  // 過濾器
  filter: FilterOption
  setFilter: (filter: FilterOption) => void

  // 統計
  getFilteredItems: () => FoodItem[]
}

export function useFoodContext(): FoodContextValue
```

**狀態流向：**
```
本地操作 → Context.dispatch → IndexedDB (同步)
                            → Firestore (非同步)
                            ↓
UI 訂閱 Context → 重新渲染
```

**測試方式：** Context + useReducer 單元測試

---

#### 2.2 主業務 Hook (`src/hooks/useFoodItems.ts`)
**目的：** 食品項目的 CRUD 邏輯

```typescript
export function useFoodItems() {
  // 初始化：載入本地 + 遠端資料
  useEffect(() => {
    const initItems = async () => {
      // 1. 先載入本地 IndexedDB
      const cached = await getAllFoodItems()
      setItems(cached)

      // 2. 後台同步遠端 Firestore
      const userId = getOrCreateUserID()
      const remoteItems = await readAllFoodItems(userId)

      // 3. 合併、去重、更新 IndexedDB
      const merged = mergeItems(cached, remoteItems)
      await saveToIndexedDB(merged)
      setItems(merged)
    }

    initItems()
  }, [])

  return {
    items,
    // CRUD 方法
    addItem: async (input: FoodItemInput) => {
      const userId = getOrCreateUserID()

      // 1. 本地立即新增
      const item = createLocalItem(input)
      await addFoodItem(item)
      dispatch({ type: 'ADD', payload: item })

      // 2. 後台上傳圖片
      const imageUrl = await uploadImageToStorage(userId, item.id, input.imageFile)

      // 3. 遠端儲存
      await createFoodItem(userId, { ...input, image_url: imageUrl })
    },

    updateItem: async (id: string, updates: Partial<FoodItemInput>) => {
      const userId = getOrCreateUserID()

      // 本地 + 遠端同步
      const updated = { ...items.find(i => i.id === id), ...updates }
      await updateFoodItem(userId, id, updated)
      await updateFoodItem(id, updated)
      dispatch({ type: 'UPDATE', payload: updated })
    },

    deleteItem: async (id: string) => {
      const userId = getOrCreateUserID()
      await deleteFoodItem(userId, id)
      await deleteFoodItem(id)
      dispatch({ type: 'DELETE', payload: id })
    },
  }
}
```

**測試方式：** Hook 測試 (renderHook) + mock Firebase/IndexedDB

---

#### 2.3 相機/圖片上傳 Hook (`src/hooks/useImageUpload.ts`)
**目的：** 圖片選擇、壓縮、Gemini 調用流程

```typescript
export function useImageUpload() {
  return {
    // 1. 選擇圖片
    selectImage: async (file: File): Promise<CaptureResult> => {
      const compressed = await compressImage(file)
      const preview = await getImagePreview(compressed)
      return { dataUrl: preview, file: compressed }
    },

    // 2. 呼叫 Gemini 識別
    identifyFood: async (imageBase64: string): Promise<GeminiResponse> => {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        body: JSON.stringify({ image_data: imageBase64 }),
      })
      return response.json()
    },

    // 3. 狀態管理
    uploading: boolean
    error: string | null
  }
}
```

**測試方式：** mock fetch + Gemini response

---

### **階段 3️⃣: API 路由層**

#### 3.1 Gemini API 代理 (`src/app/api/gemini/route.ts`)
**目的：** 後端安全調用 Gemini，隱藏 API Key

```typescript
// POST /api/gemini
interface RequestBody {
  image_data: string  // base64
}

interface ResponseBody extends GeminiResponse {
  // 額外的伺服器端欄位
  processed_at: string  // ISO timestamp
}

export async function POST(req: Request): Promise<Response> {
  try {
    const { image_data } = await req.json()

    // 1. 驗證
    if (!image_data) {
      return Response.json({ error: '圖片資料不能為空' }, { status: 400 })
    }

    // 2. 呼叫 Gemini Vision API
    const result = await callGeminiVisionAPI(image_data)

    // 3. 驗證回應格式
    if (!result.product_name || !result.expiry_date) {
      return Response.json(
        {
          product_name: '',
          expiry_date: '',
          confidence: 0,
          notes: '無法識別圖片中的食品信息',
        },
        { status: 200 }  // 200 以示成功調用，但識別失敗
      )
    }

    // 4. 日期格式驗證
    if (!isValidDateFormat(result.expiry_date)) {
      result.expiry_date = normalizeDate(result.expiry_date)
    }

    return Response.json({
      ...result,
      processed_at: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json(
      { error: '伺服器錯誤，請稍後重試' },
      { status: 500 }
    )
  }
}
```

**Gemini 提示詞** (`src/lib/gemini.ts`)
```typescript
export const FOOD_RECOGNITION_PROMPT = `
你是一個專業的食品識別助手。
根據上傳的食品包裝照片，提取以下信息：

1. 產品名稱 (例如: "義美小泡芙")
2. 有效期限 (必須是 YYYY-MM-DD 格式，例如 2025-12-25)
   - 如果只看到月份和年份，假設為該月最後一天
   - 如果看到「2025年12月」，轉換為 2025-12-31
3. 信心度 (0-100)

回應必須是有效的 JSON 格式：
{
  "product_name": "...",
  "expiry_date": "YYYY-MM-DD",
  "confidence": 95,
  "notes": "任何額外信息"
}

如果無法識別，回應：
{
  "product_name": "",
  "expiry_date": "",
  "confidence": 0,
  "notes": "無法識別圖片中的食品信息"
}
`
```

**測試方式：** API 路由測試 (Next.js test) + mock Gemini SDK

---

### **階段 4️⃣: UI 組件層**

#### 4.1 相機按鈕組件 (`src/components/Camera/CameraButton.tsx`)
**使用場景：** 首頁中央大按鈕

```typescript
export function CameraButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = () => inputRef.current?.click()

  const handleFileSelect = async (file: File) => {
    setIsLoading(true)
    try {
      const { dataUrl, file: compressedFile } = await selectImage(file)
      // 導向到確認 Modal（下一步）
      showConfirmationModal({ preview: dataUrl, file: compressedFile })
    } catch (error) {
      showErrorToast('圖片上傳失敗')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
    >
      {isLoading ? <Spinner /> : '📷'}
    </button>
  )
}
```

**無障礙需求：**
- aria-label: "上傳食品照片"
- 最小觸控區域：80×80px ✅

---

#### 4.2 確認對話框 Modal (`src/components/Modal/ConfirmationModal.tsx`)
**使用場景：** Gemini 識別完成後，用戶編輯確認

```typescript
export interface ConfirmationModalProps {
  isOpen: boolean
  loading: boolean
  product_name: string
  expiry_date: string
  confidence: number
  preview: string  // data URL
  onConfirm: (data: { product_name: string; expiry_date: string }) => void
  onCancel: () => void
}

export function ConfirmationModal(props: ConfirmationModalProps) {
  // 使用 controlled inputs 允許用戶編輯
  const [name, setName] = useState(props.product_name)
  const [date, setDate] = useState(props.expiry_date)

  return (
    <dialog open={props.isOpen}>
      {/* 圖片預覽 */}
      <img src={props.preview} alt="食品照片" className="w-full max-h-64" />

      {/* 信心度指示器 */}
      <div className="text-sm text-gray-600">
        識別信心度: {props.confidence}%
      </div>

      {/* 可編輯的表單欄位 */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="產品名稱"
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* 按鈕 */}
      <button
        onClick={() => props.onConfirm({ product_name: name, expiry_date: date })}
        disabled={!name || !date || props.loading}
      >
        {props.loading ? '保存中...' : '確認'}
      </button>
      <button onClick={props.onCancel} disabled={props.loading}>
        取消
      </button>
    </dialog>
  )
}
```

**驗證規則：**
- 產品名稱：非空 + 長度 < 100
- 到期日期：YYYY-MM-DD 格式 + 未來日期

---

#### 4.3 食品項目卡片 (`src/components/Inventory/FoodItemCard.tsx`)
**使用場景：** 庫存清單中的每個項目

```typescript
export interface FoodItemCardProps {
  item: FoodItem
  onDelete: (id: string) => void
  onEdit: (item: FoodItem) => void
}

export function FoodItemCard({ item, onDelete, onEdit }: FoodItemCardProps) {
  const statusColor = {
    red: 'bg-red-100 text-red-900',
    yellow: 'bg-yellow-100 text-yellow-900',
    green: 'bg-green-100 text-green-900',
  }[item.status]

  const statusIcon = {
    red: '🔴',
    yellow: '🟡',
    green: '✅',
  }[item.status]

  return (
    <div className={`p-4 rounded-lg ${statusColor} cursor-pointer`}>
      {/* 圖片 + 基本信息 */}
      <div className="flex gap-4">
        <img src={item.image_url} alt="" className="w-24 h-24 rounded-lg object-cover" />

        <div className="flex-1">
          <h3 className="text-lg font-bold">{item.product_name}</h3>
          <p className="text-sm">{formatDateChinese(item.expiry_date)}</p>
          <p className="text-sm">{getExpiryMessage(item.days_until_expiry)}</p>
        </div>
      </div>

      {/* 狀態標籤 */}
      <div className="mt-2 flex gap-2">
        <span>{statusIcon} {getStatusLabel(item.status)}</span>
        <span className="text-xs opacity-70">信心度: {item.confidence}%</span>
      </div>

      {/* 按鈕 (長按或點擊) */}
      <div className="mt-3 flex gap-2">
        <button onClick={() => onEdit(item)}>編輯</button>
        <button onClick={() => onDelete(item.id)} className="text-red-600">刪除</button>
      </div>
    </div>
  )
}
```

**觸控區域要求：**
- 最小點擊區域：56×56px
- 長按操作支援（可選）

---

#### 4.4 庫存清單 (`src/components/Inventory/FoodList.tsx`)
**使用場景：** `/inventory` 頁面主體

```typescript
export function FoodList() {
  const { items, stats, filter, setFilter, deleteItem, updateItem } = useFoodContext()

  const filtered = items.filter((item) => {
    if (filter === 'all') return true
    return item.status === filter
  })

  // 分組顯示
  const grouped = groupByStatus(filtered)

  return (
    <div className="space-y-6">
      {/* 統計概覽 */}
      <StatsCard stats={stats} />

      {/* 篩選標籤 */}
      <FilterTabs current={filter} onChange={setFilter} />

      {/* 分組列表 */}
      {Object.entries(grouped).map(([status, items]) => (
        <section key={status}>
          <h3 className="text-lg font-bold mb-3">
            {getStatusLabel(status as FoodStatus)}
            <span className="text-sm font-normal text-gray-600">({items.length})</span>
          </h3>

          <div className="space-y-3">
            {items.map((item) => (
              <FoodItemCard
                key={item.id}
                item={item}
                onDelete={deleteItem}
                onEdit={(updated) => updateItem(updated.id, updated)}
              />
            ))}
          </div>
        </section>
      ))}

      {/* 空狀態 */}
      {filtered.length === 0 && (
        <EmptyState />
      )}
    </div>
  )
}
```

---

## 🧪 測試策略 (根據商業邏輯優先)

### **必測試 (高優先級)**

| 模塊 | 測試項目 | 方式 |
|------|--------|------|
| `date.ts` | ✅ 已完成 | Jest 單元測試 |
| `useFoodItems.ts` | CRUD 完整流程 | renderHook + mock Firebase |
| `FoodContext.tsx` | 狀態管理、篩選 | Context TestProvider |
| `ConfirmationModal.tsx` | 表單驗證、提交 | React Testing Library |
| `FoodItemCard.tsx` | 過期狀態顯示 | snapshot + interaction |

### **可選測試 (低優先級，用 mock)**

| 模塊 | Mock 方式 |
|------|----------|
| Gemini API 識別結果 | `jest.mock` 返回固定回應 |
| Firebase 上傳進度 | Mock `uploadBytesResumable` |
| IndexedDB 操作 | `jest-mock-extended` |

### **測試檔案結構**
```
src/
├── lib/__tests__/
│   ├── date.test.ts        ✅
│   ├── firestore.test.ts   📝
│   ├── storage.test.ts     📝
│   └── image.test.ts       📝
├── context/__tests__/
│   └── FoodContext.test.tsx 📝
├── hooks/__tests__/
│   ├── useFoodItems.test.ts 📝
│   └── useImageUpload.test.ts 📝
└── components/__tests__/
    ├── Camera/
    │   └── CameraButton.test.tsx 📝
    └── Modal/
        └── ConfirmationModal.test.tsx 📝
```

---

## 🔄 實現流程圖

```
┌─ 首頁 (page.tsx)
│  ├─ CameraButton (點擊相機)
│  │  └─ 觸發 file input
│  │
│  ├─ 選中圖片
│  │  └─ useImageUpload.selectImage()
│  │     ├─ 壓縮圖片
│  │     └─ 生成預覽
│  │
│  ├─ 展示 ConfirmationModal
│  │  ├─ 呼叫 POST /api/gemini
│  │  │  └─ Gemini 識別 → {product_name, expiry_date, confidence}
│  │  └─ 用戶可編輯欄位
│  │
│  ├─ 點擊「確認」
│  │  └─ useFoodItems.addItem()
│  │     ├─ 本地寫入 IndexedDB (同步)
│  │     ├─ 圖片上傳至 Firebase Storage (異步)
│  │     └─ 資料寫入 Firestore (異步)
│  │
│  └─ 返回首頁，顯示統計更新
│
├─ 庫存頁面 (/inventory)
│  ├─ FoodList 組件
│  │  ├─ 讀取 Context (useFoodContext)
│  │  ├─ 按 status 分組
│  │  ├─ 按 expiry_date 排序
│  │  └─ 渲染 FoodItemCard
│  │
│  └─ 用戶交互
│     ├─ 刪除 → useFoodItems.deleteItem()
│     ├─ 編輯 → Modal → useFoodItems.updateItem()
│     └─ 篩選 → setFilter()
```

---

## 📦 環境變數檢查清單

```env
# .env.local (Git ignored)
NEXT_PUBLIC_FIREBASE_API_KEY=your-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=app-id

GEMINI_API_KEY=your-gemini-key

# Optional
NEXT_PUBLIC_VERCEL_ENV=development
```

**驗證：** 啟動時檢查必要環境變數是否存在

---

## 🚀 實現清單 (可複製到 GitHub Issue)

### 階段 1: 基礎設施
- [ ] `src/lib/firebase.ts` - Firebase 初始化 + UUID 管理
- [ ] `src/lib/storage.ts` - IndexedDB 層
- [ ] `src/lib/firestore.ts` - Firestore CRUD
- [ ] `src/lib/image.ts` - 圖片壓縮 + Base64 轉換
- [ ] `src/lib/gemini.ts` - Gemini API 工具 + 提示詞

### 階段 2: 業務邏輯
- [ ] `src/context/FoodContext.tsx` - Context + useReducer
- [ ] `src/hooks/useFoodItems.ts` - CRUD hooks
- [ ] `src/hooks/useImageUpload.ts` - 圖片上傳 hook
- [ ] 對應測試檔案 (x5)

### 階段 3: API 路由
- [ ] `src/app/api/gemini/route.ts` - POST /api/gemini
- [ ] 對應測試檔案

### 階段 4: UI 組件
- [ ] `src/components/Camera/CameraButton.tsx`
- [ ] `src/components/Camera/ImagePreview.tsx`
- [ ] `src/components/Modal/ConfirmationModal.tsx`
- [ ] `src/components/Inventory/FoodItemCard.tsx`
- [ ] `src/components/Inventory/FoodList.tsx`
- [ ] `src/components/Inventory/FilterTabs.tsx`
- [ ] 更新 `src/app/page.tsx` - 集成相機流程
- [ ] 更新 `src/app/inventory/page.tsx` - 集成清單
- [ ] 對應測試檔案 (x8)

### 階段 5: 完整性檢查
- [ ] PWA manifest 配置 (public/manifest.json)
- [ ] Service Worker 設置
- [ ] 環境變數文件建立
- [ ] 所有 lint 檢查通過
- [ ] 全量測試執行 (npm test)
- [ ] 本地 dev 伺服器驗證 (npm run dev)

---

## 💡 重點決策理由

### Q: 為什麼先做基礎設施？
**A:** UI 高度依賴資料層，先確保資料層穩定、可測試，UI 才能獨立開發、測試。

### Q: 為什麼 Context 而不是 Redux？
**A:** 無帳號模式下只有單一用戶，狀態結構簡單。Redux 過度工程。

### Q: 為什麼 IndexedDB 層分離？
**A:** 讓離線支援邏輯集中，便於單獨測試；同時讓 Firestore 邏輯獨立。

### Q: 為什麼 Gemini API 用 mock 測試？
**A:** API 配額有限、成本高、速度慢。Mock 測試的是「我們如何使用 API」的邏輯，真實 API 用 E2E 測試或手動測試。

---

## 📞 後續確認項

在開始實現前，請確認：

1. **Firebase 專案設置完成**？ (有效的 credentials)
2. **Gemini API Key 已申請**？
3. **Firestore 安全規則已設置**？ (限制只能訪問自己的資料)
4. **測試環境選擇**？ (Firebase Emulator Suite 或 mock？)

---

**Next Step:** 收到確認後，開始實現階段 1 🚀

