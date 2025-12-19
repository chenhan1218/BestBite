# BestBite 架構設計文檔

## 🏗️ 系統架構概覽

```
┌────────────────────────────────────────────────────────────┐
│                      用戶設備 (PWA)                          │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            React + Next.js App (Browser)             │  │
│  │                                                       │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │  │
│  │  │ Home Page   │  │ Inventory    │  │ Modal      │  │  │
│  │  │ (Camera)    │  │ Dashboard    │  │ (Confirm)  │  │  │
│  │  └──────┬──────┘  └──────┬───────┘  └────────────┘  │  │
│  │         │                │                           │  │
│  │         └────────────────┴───────────────────────┐   │  │
│  │                                                   │   │  │
│  │                  FoodContext (State)             │   │  │
│  │              (Redux-like State Management)       │   │  │
│  │                                                   │   │  │
│  │         ┌─────────────────────────────────┐     │   │  │
│  │         │ useFoodItems Hook (CRUD ops)    │     │   │  │
│  │         └──────────────┬──────────────────┘     │   │  │
│  │                        │                         │   │  │
│  └────────────────────────┼─────────────────────────┤───┘  │
│                           │                         │       │
│  ┌────────────────────────┼─────────────────────────┼─────┐ │
│  │         Local Storage (IndexedDB)                 │     │ │
│  │  [用於離線支援和快速檢索]                        │     │ │
│  └────────────────────────┬─────────────────────────┘     │ │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Vercel  │  │ Firebase │  │  Google  │
        │(CDN/API) │  │(Firestore│  │  Gemini  │
        │          │  │+Storage) │  │   API    │
        └──────────┘  └──────────┘  └──────────┘
```

---

## 🔄 數據流 (Data Flow)

### 1️⃣ 添加食品流程

```
CameraButton.tsx (用戶點擊)
    ↓
ImageUpload.tsx (選擇或拍攝照片)
    ↓
圖片壓縮 (image.ts)
    ↓
發送 POST /api/gemini (帶 Base64)
    ↓
Gemini API 返回: { product_name, expiry_date, confidence }
    ↓
ConfirmationModal.tsx (用戶確認或編輯)
    ↓
useFoodItems.addFoodItem(data)
    ↓
┌─────────────────────────┐
│ FoodContext (Redux)     │
│ 更新全局 foodItems[]    │
└────────────┬────────────┘
             │
             ├─→ 保存到 Firestore (firebase.ts)
             │
             ├─→ 保存到 IndexedDB (storage.ts)
             │
             └─→ 觸發 UI 更新 (React re-render)
```

### 2️⃣ 查看清單流程

```
Home Page (統計數字)
    ↓
點擊「查看清單」
    ↓
進入 Inventory Page
    ↓
FoodContext.getFoodItems()
    ↓
讀取 IndexedDB (快速)
    ↓
或同步 Firestore (最新數據)
    ↓
FoodList.tsx
  ├─ 計算 days_until_expiry
  ├─ 分配 status (red/yellow/green)
  ├─ 排序和分組
  │
  └─ 渲染：
      ├─ 紅燈區 (🔴 紅色背景，大字體)
      ├─ 黃燈區 (🟡 黃色背景)
      └─ 綠燈區 (🟢 綠色背景)
```

---

## 📁 組件樹結構

```
<RootLayout>
  │
  ├─ <HomePage>
  │   ├─ <CameraButton />         (巨大相機按鈕)
  │   ├─ <QuickStats />            (X 個紅燈 / X 個黃燈 / X 個綠燈)
  │   └─ <FoodContext.Provider>
  │
  ├─ <InventoryPage>
  │   ├─ <Header />                (標題 + 返回按鈕)
  │   ├─ <FoodList>
  │   │   ├─ <RedZone>             (紅燈區 - 置頂)
  │   │   │   └─ <FoodItemCard>[] (多個項目)
  │   │   ├─ <YellowZone>
  │   │   │   └─ <FoodItemCard>[]
  │   │   └─ <GreenZone>
  │   │       └─ <FoodItemCard>[]
  │   └─ <FoodContext.Provider>
  │
  └─ <Modal>
      └─ <ConfirmationModal>       (AI 結果確認)
          ├─ 產品名稱輸入框
          ├─ 有效期輸入框
          ├─ 圖片預覽
          └─ 確認 / 取消 按鈕
```

---

## 🧠 狀態管理 (FoodContext)

### Context 結構

```typescript
interface FoodContextType {
  // 狀態
  foodItems: FoodItem[]
  loading: boolean
  error: string | null

  // 操作
  addFoodItem(data: FoodItemInput): Promise<void>
  updateFoodItem(id: string, data: Partial<FoodItem>): Promise<void>
  deleteFoodItem(id: string): Promise<void>
  getFoodItems(userId?: string): Promise<void>

  // 計算屬性
  redItems: FoodItem[]      // status === 'red'
  yellowItems: FoodItem[]   // status === 'yellow'
  greenItems: FoodItem[]    // status === 'green'
}
```

### 初始化和同步策略

```typescript
// 1. 應用啟動時
useEffect(() => {
  // 從 IndexedDB 快速加載
  loadFromLocalStorage()

  // 同時從 Firestore 同步最新數據
  syncFromFirestore()
}, [])

// 2. 添加項目時
const addFoodItem = async (data) => {
  // 立即更新本地狀態 (樂觀更新)
  setFoodItems([...foodItems, data])

  // 保存到 Firestore
  await firestore.add(data)

  // 保存到 IndexedDB
  await storage.save(data)
}

// 3. 實時監聽 Firestore 變化
unsubscribe = db.collection('foodItems')
  .onSnapshot(snapshot => {
    updateLocalState(snapshot)
  })
```

---

## 🔌 API 路由設計

### POST /api/gemini (圖像識別)

**請求:**
```typescript
interface GeminiRequest {
  image: string              // Base64 編碼的圖片
  mimeType: string           // "image/jpeg" | "image/png"
}
```

**回應:**
```typescript
interface GeminiResponse {
  product_name: string       // "義美小泡芙"
  expiry_date: string        // "2025-12-25"
  confidence: number         // 0-100
  notes?: string             // 額外信息或警告
}
```

**實現邏輯:**
```typescript
// route.ts
export async function POST(request: Request) {
  const { image, mimeType } = await request.json()

  // 調用 Gemini API
  const response = await gemini.generateContent({
    contents: [{
      parts: [{
        inlineData: {
          data: image,
          mimeType
        }
      }, {
        text: "識別產品名稱和有效期..."
      }]
    }]
  })

  // 解析和驗證
  const parsed = parseGeminiResponse(response)

  // 返回
  return Response.json(parsed)
}
```

---

## 💾 Firebase 集合設計

### 數據庫結構

```
Firestore Database
│
├─ users/                          # 用戶集合
│  └─ {userId}/
│     ├─ profile (文檔)
│     │  ├─ name: string
│     │  ├─ email: string
│     │  └─ created_at: timestamp
│     │
│     └─ food_items/ (子集合)
│        └─ {itemId} (文檔)
│           ├─ product_name: string
│           ├─ expiry_date: string (YYYY-MM-DD)
│           ├─ days_until_expiry: number
│           ├─ status: "red" | "yellow" | "green"
│           ├─ image_url: string
│           ├─ confidence: number
│           ├─ created_at: timestamp
│           └─ updated_at: timestamp
│
└─ Storage/                        # Firebase Storage
   └─ users/
      └─ {userId}/
         └─ food_images/
            └─ {itemId}.jpg
```

### 索引和查詢優化

```typescript
// 查詢所有食品項 (按過期日期排序)
db.collection('users')
  .doc(userId)
  .collection('food_items')
  .orderBy('expiry_date', 'asc')
  .get()

// 查詢紅燈項 (7 天內)
db.collection('users')
  .doc(userId)
  .collection('food_items')
  .where('status', '==', 'red')
  .orderBy('expiry_date', 'asc')
  .get()
```

---

## 🖼️ 組件詳細設計

### CameraButton.tsx

```typescript
interface CameraButtonProps {
  onImageSelected: (file: File) => void
  loading?: boolean
}

export function CameraButton({ onImageSelected, loading }: Props) {
  // 功能:
  // 1. 點擊打開原生相機 (mobile) 或檔案選擇 (desktop)
  // 2. 顯示「拍攝中...」狀態
  // 3. 回調返回選定的文件

  // 尺寸: 80x80px (圓形按鈕)
  // 字體: 48px emoji 📷
  // 顏色: 藍色背景 + 白色圖標
}
```

### FoodItemCard.tsx

```typescript
interface FoodItemCardProps {
  item: FoodItem
  status: 'red' | 'yellow' | 'green'
  onDelete: (id: string) => void
  onEdit: (id: string) => void
}

export function FoodItemCard({ item, status, onDelete, onEdit }: Props) {
  // 功能:
  // 1. 顯示產品名稱 (大字 24px)
  // 2. 顯示過期日期 (format: "12月25日")
  // 3. 顯示剩餘天數 (format: "還有 X 天")
  // 4. 顯示產品圖片縮圖
  // 5. 長按或向左滑動刪除

  // 尺寸根據狀態:
  // - Red: padding 24px, 字體更大 (28px)
  // - Yellow/Green: padding 16px, 字體 20px
}
```

### ConfirmationModal.tsx

```typescript
interface ConfirmationModalProps {
  imagePreview: string
  geminiResult: GeminiResponse
  onConfirm: (data: FoodItemInput) => void
  onCancel: () => void
}

export function ConfirmationModal({
  imagePreview,
  geminiResult,
  onConfirm,
  onCancel
}: Props) {
  // 功能:
  // 1. 展示圖片預覽 (左側)
  // 2. 展示識別結果 (右側，可編輯)
  //    - 產品名稱輸入框
  //    - 有效期選擇器
  //    - 信心度顯示
  // 3. 確認/取消按鈕

  // 設計: 適應移動設備，2 列布局 (大屏) / 1 列堆疊 (小屏)
}
```

---

## 🔐 安全考慮

### API 密鑰管理

```env
# 環境變數分層
NEXT_PUBLIC_*         # 公開變數（暴露給瀏覽器）
(無前綴)              # 私有變數（僅在服務器運行）

# 示例
NEXT_PUBLIC_FIREBASE_API_KEY=xxx      # 暴露
GEMINI_API_KEY=xxx                    # 私有 (API 路由中使用)
```

### 數據驗證

```typescript
// 在保存前驗證
function validateFoodItem(data: any): FoodItem {
  if (!data.product_name || data.product_name.trim() === '') {
    throw new Error('產品名稱不能為空')
  }

  const date = new Date(data.expiry_date)
  if (isNaN(date.getTime())) {
    throw new Error('有效期日期無效')
  }

  return {
    product_name: data.product_name.trim(),
    expiry_date: data.expiry_date,
    // ... 其他字段
  }
}
```

### 圖片安全

```typescript
// 壓縮圖片以限制大小
async function compressImage(file: File): Promise<Blob> {
  const canvas = await new Promise<HTMLCanvasElement>(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ratio = Math.min(800 / img.width, 800 / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas)
    }
    img.src = URL.createObjectURL(file)
  })

  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.8)
  })
}
```

---

## 📱 響應式設計斷點

```typescript
// Tailwind 斷點
const breakpoints = {
  sm: '640px',   // 手機橫屏
  md: '768px',   // 平板
  lg: '1024px',  // 桌面
  xl: '1280px',  // 寬屏
}

// 佈局調整
// - xs-md: 單列布局 (堆疊)
// - md+: 雙列布局 (並行)

// 示例: ConfirmationModal
<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
  <ImagePreview />         {/* 左列 (md+) */}
  <FormFields />           {/* 右列 (md+) */}
</div>
```

---

## 🧪 測試策略

### 單元測試 (Jest + React Testing Library)

```typescript
// 示例: FoodItemCard 測試
describe('FoodItemCard', () => {
  it('displays product name correctly', () => {
    const item = { product_name: '小泡芙', expiry_date: '2025-12-25' }
    render(<FoodItemCard item={item} status="green" />)
    expect(screen.getByText('小泡芙')).toBeInTheDocument()
  })

  it('calls onDelete when swiped left', () => {
    const onDelete = jest.fn()
    render(<FoodItemCard item={item} status="green" onDelete={onDelete} />)
    // 模擬滑動事件
    // 驗證 onDelete 被調用
  })
})
```

### 集成測試

```typescript
// 示例: 完整的添加食品流程
describe('Add Food Item Flow', () => {
  it('should save food item after AI confirmation', async () => {
    // 1. 點擊相機按鈕
    // 2. 選擇圖片
    // 3. 驗證 Gemini API 被調用
    // 4. 確認結果
    // 5. 驗證 Firestore 中的數據
    // 6. 驗證 UI 更新
  })
})
```

### E2E 測試 (Playwright/Cypress)

```typescript
// 示例: 移動設備上的完整用戶流程
test('user can add and view food items on mobile', async ({ page }) => {
  await page.goto('http://localhost:3000')

  // 1. 首頁應顯示相機按鈕
  await expect(page.getByRole('button', { name: /camera/i })).toBeVisible()

  // 2. 點擊相機按鈕
  await page.getByRole('button', { name: /camera/i }).click()

  // 3. 上傳圖片
  await page.setInputFiles('input[type="file"]', 'test-image.jpg')

  // 4. 等待 AI 識別
  await expect(page.getByText(/識別中/)).toBeVisible()

  // 5. 確認結果
  await page.getByRole('button', { name: /確認/i }).click()

  // 6. 驗證項目出現在清單中
  await expect(page.getByText(/小泡芙/)).toBeVisible()
})
```

---

## 🚀 性能優化

### 圖片優化
- 自動壓縮到 < 2MB (JPEG 80% 質量)
- 使用 WebP 格式 (如果支援)
- 延遲加載 (Intersection Observer)

### 代碼分割
```typescript
// 動態導入大型組件
const InventoryPage = dynamic(() => import('./inventory'), { ssr: false })
```

### 狀態管理優化
```typescript
// 使用 useCallback 防止不必要的重新渲染
const addFoodItem = useCallback(async (data) => {
  // ...
}, [])

// 使用 useMemo 優化計算
const redItems = useMemo(() =>
  foodItems.filter(item => item.status === 'red'),
  [foodItems]
)
```

---

**Last Updated:** 2025-12-15
**Architect:** Claude Code 🤖
