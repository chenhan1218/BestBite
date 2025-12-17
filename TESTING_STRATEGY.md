# 🧪 BestBite 測試策略文檔

**目的：** 定義測試方法、工具、覆蓋範圍、和最佳實踐

**Last Updated：** 2025-12-17
**Audience：** QA、開發者、技術主管

---

## 📊 測試金字塔

```
            ▲
           /│\
          / │ \  E2E Tests (未來)
         /  │  \ 5-10%
        ╱───┼───╲
       /    │    \  Integration Tests (未來)
      /     │     \ 15-20%
     ╱──────┼──────╲
    /       │       \ Unit Tests (當前重點)
   /        │        \ 70-80%
  ╱─────────┼─────────╲
```

### 當前階段（Phase 1）
- ✅ **單元測試** - Jest + Mocks（高優先級）
- ❌ **集成測試** - 暫不進行
- ❌ **E2E 測試** - 暫不進行（成本考慮）

### 未來階段（Phase 2+）
- ✅ 添加集成測試（Firestore 實際連接）
- ✅ 添加 E2E 測試（Playwright/Cypress）

---

## 🛠️ 測試工具和配置

### 已安裝依賴

| 工具 | 用途 | 版本 |
|------|------|------|
| **Jest** | 測試框架 | 30.2.0 |
| **@testing-library/react** | React 元件測試 | 16.3.0 |
| **@testing-library/jest-dom** | Jest 匹配器 | 6.9.1 |
| **fake-indexeddb** | IndexedDB Mock | 6.2.5 |
| **jest-environment-jsdom** | 瀏覽器環境模擬 | 30.2.0 |

### Jest 配置（jest.config.js）

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**'
  ]
}
```

### Jest 設置（jest.setup.js）

```javascript
// Mock localStorage (不是 JSDOM 的一部分)
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Mock IndexedDB
require('fake-indexeddb/auto')

// 環境變數
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key'
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project'
// ... 其他 Firebase 變數

// 聲明 structuredClone（Node.js 17.5+ 才有）
if (!global.structuredClone) {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val))
}
```

---

## ✅ 測試覆蓋率目標

### 按模塊

| 模塊 | 目標 | 現況 | 優先級 |
|------|------|------|--------|
| `date.ts` | 90%+ | ✅ ~85% | 高 |
| `gemini.ts` | 80%+ | 🔄 進行中 | 高 |
| `firebase.ts` | 60%+ | 🔄 Mock 測試 | 中 |
| `firestore.ts` | 70%+ | 🔄 Mock 測試 | 高 |
| `storage.ts` | 70%+ | 🔄 Mock 測試 | 中 |
| `image.ts` | 60%+ | ❌ 待實現 | 低 |
| Components | 20%+ | ❌ 待實現 | 低 |

### 全項目目標
- **功能代碼覆蓋率：** >70%
- **分支覆蓋率：** >60%
- **所有關鍵路徑測試完整性：** 100%

---

## 📝 測試文件結構

### 位置規範

```
src/
├── lib/
│   ├── date.ts
│   ├── gemini.ts
│   ├── firebase.ts
│   ├── firestore.ts
│   ├── storage.ts
│   └── __tests__/               # 與被測試模塊同級
│       ├── date.test.ts
│       ├── gemini.test.ts
│       ├── firebase.test.ts
│       ├── firestore.test.ts
│       └── storage.test.ts
```

### 命名規範

- 測試文件：`{moduleName}.test.ts`
- 測試套件：`describe('moduleName', () => { ... })`
- 測試用例：`test('should do X when Y', () => { ... })`

---

## 🎯 測試類型詳解

### 1️⃣ 單元測試 - Pure Functions

**目標：** 測試業務邏輯的正確性

#### 示例：date.ts 測試

```typescript
describe('calculateDaysUntilExpiry', () => {
  test('should return 0 for today\'s expiry date', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(calculateDaysUntilExpiry(today)).toBe(0)
  })

  test('should return positive number for future date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const futureStr = future.toISOString().split('T')[0]
    expect(calculateDaysUntilExpiry(futureStr)).toBe(5)
  })

  test('should return negative for past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    const pastStr = past.toISOString().split('T')[0]
    expect(calculateDaysUntilExpiry(pastStr)).toBe(-3)
  })
})

describe('getFoodStatus', () => {
  test('should return "red" for days <= 7', () => {
    expect(getFoodStatus(7)).toBe('red')
    expect(getFoodStatus(3)).toBe('red')
    expect(getFoodStatus(0)).toBe('red')
  })

  test('should return "yellow" for 8-30 days', () => {
    expect(getFoodStatus(8)).toBe('yellow')
    expect(getFoodStatus(15)).toBe('yellow')
    expect(getFoodStatus(30)).toBe('yellow')
  })

  test('should return "green" for days > 30', () => {
    expect(getFoodStatus(31)).toBe('green')
    expect(getFoodStatus(100)).toBe('green')
  })
})
```

#### 最佳實踐

✅ **要做：**
- 測試邊界情況（0, 負數, 非常大的數）
- 測試多個輸入組合
- 測試錯誤條件
- 使用清晰的測試名稱（"should X when Y"）

❌ **不要做：**
- 測試第三方庫（假設它們正確）
- 測試常量定義
- 過度模擬（應測試真實邏輯）

---

### 2️⃣ 單元測試 - API Responses

**目標：** 測試 API 回應解析和驗證

#### 示例：gemini.ts 測試

```typescript
describe('parseGeminiResponse', () => {
  test('should parse valid JSON response', () => {
    const response = {
      product_name: '義美小泡芙',
      expiry_date: '2025-12-25',
      confidence: 95
    }

    const result = parseGeminiResponse(response)
    expect(result.product_name).toBe('義美小泡芙')
    expect(result.expiry_date).toBe('2025-12-25')
    expect(result.confidence).toBe(95)
  })

  test('should validate date format (YYYY-MM-DD)', () => {
    expect(() => {
      parseGeminiResponse({
        product_name: '商品',
        expiry_date: '25/12/2025',  // 錯誤格式
        confidence: 80
      })
    }).toThrow('Invalid date format')
  })

  test('should validate confidence is 0-100', () => {
    expect(() => {
      parseGeminiResponse({
        product_name: '商品',
        expiry_date: '2025-12-25',
        confidence: 150  // 超出範圍
      })
    }).toThrow('Confidence must be 0-100')
  })

  test('should trim product name', () => {
    const response = {
      product_name: '  義美小泡芙  ',
      expiry_date: '2025-12-25',
      confidence: 90
    }

    const result = parseGeminiResponse(response)
    expect(result.product_name).toBe('義美小泡芙')
  })
})

describe('isValidGeminiResponse', () => {
  test('should return true for valid response', () => {
    expect(isValidGeminiResponse({
      product_name: '商品',
      expiry_date: '2025-12-25',
      confidence: 80
    })).toBe(true)
  })

  test('should return false if missing required fields', () => {
    expect(isValidGeminiResponse({
      product_name: '商品'
      // 缺少 expiry_date 和 confidence
    })).toBe(false)
  })
})
```

#### 關鍵測試場景
- ✅ 有效 JSON
- ✅ 缺少必要欄位
- ✅ 欄位類型錯誤
- ✅ 邊界值（空字串、零、負數）
- ✅ 空白字元修整
- ✅ 大小寫敏感性

---

### 3️⃣ 單元測試 - Business Logic with Mocks

**目標：** 測試業務邏輯，模擬外部依賴

#### 示例：firestore.ts 測試（Mocked）

```typescript
import * as firestoreModule from '../firestore'
import * as firebaseModule from '../firebase'

jest.mock('../firebase')
jest.mock('firebase/firestore')

describe('createFoodItem', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should create food item with calculated fields', async () => {
    const userId = 'test-user-123'
    const input = {
      product_name: '義美小泡芙',
      expiry_date: '2025-12-25',
      confidence: 95
    }

    // Mock Firestore addDoc
    const mockDocRef = { id: 'item-123' }
    ;(firestoreModule.addDoc as jest.Mock).mockResolvedValue(mockDocRef)

    const result = await firestoreModule.createFoodItem(userId, input)

    expect(result).toHaveProperty('id', 'item-123')
    expect(result).toHaveProperty('product_name', '義美小泡芙')
    expect(result).toHaveProperty('days_until_expiry')  // 自動計算
    expect(result).toHaveProperty('status')  // 自動計算
  })

  test('should throw error if expiry_date is invalid', async () => {
    await expect(
      firestoreModule.createFoodItem('user-123', {
        product_name: '商品',
        expiry_date: 'invalid-date'
      })
    ).rejects.toThrow('Invalid date format')
  })
})

describe('updateFoodItem', () => {
  test('should recalculate status when expiry_date changes', async () => {
    const updates = {
      expiry_date: new Date()
        .toISOString()
        .split('T')[0]  // 今天
    }

    const result = await firestoreModule.updateFoodItem(
      'user-123',
      'item-123',
      updates
    )

    expect(result.status).toBe('red')  // 今天應該是紅燈
  })
})
```

#### Mock 模式

```typescript
// 模擬模塊函數
jest.mock('../firebase')

beforeEach(() => {
  // 在每個測試前重置 mock
  jest.clearAllMocks()
})

// 設置 mock 回傳值
(someFunction as jest.Mock).mockResolvedValue({ id: '123' })

// 驗證被呼叫
expect(someFunction).toHaveBeenCalledWith(arg1, arg2)

// 驗證被呼叫多少次
expect(someFunction).toHaveBeenCalledTimes(1)
```

---

### 4️⃣ 單元測試 - Data Structures (IndexedDB)

**目標：** 測試本地存儲邏輯

#### 示例：storage.ts 測試

```typescript
describe('addFoodItem', () => {
  let db: IDBDatabase

  beforeAll(async () => {
    db = await initStorage()
  })

  afterEach(async () => {
    // 清理測試數據
    const tx = db.transaction(['food_items'], 'readwrite')
    tx.objectStore('food_items').clear()
  })

  test('should add item to IndexedDB', async () => {
    const item: FoodItem = {
      id: 'test-123',
      product_name: '義美小泡芙',
      expiry_date: '2025-12-25',
      days_until_expiry: 8,
      status: 'yellow',
      image_url: 'http://example.com/image.jpg',
      confidence: 95,
      created_at: new Date(),
      updated_at: new Date()
    }

    await addFoodItem(item)

    const stored = await getFoodItem('test-123')
    expect(stored).toEqual(item)
  })

  test('should retrieve items by status index', async () => {
    const redItem = { ...mockItem, id: 'red-1', status: 'red' }
    const yellowItem = { ...mockItem, id: 'yellow-1', status: 'yellow' }

    await addFoodItem(redItem)
    await addFoodItem(yellowItem)

    const redItems = await getFoodItemsByStatus('red')
    expect(redItems).toHaveLength(1)
    expect(redItems[0].id).toBe('red-1')
  })
})

describe('updateFoodItem', () => {
  test('should throw error if item doesn\'t exist', async () => {
    await expect(
      updateFoodItem('non-existent-id', { product_name: 'new name' })
    ).rejects.toThrow('Item not found')
  })

  test('should merge updates without overwriting', async () => {
    const original = { ...mockItem, product_name: '舊名稱' }
    await addFoodItem(original)

    await updateFoodItem(original.id, { product_name: '新名稱' })

    const updated = await getFoodItem(original.id)
    expect(updated.product_name).toBe('新名稱')
    expect(updated.image_url).toBe(original.image_url)  // 未改變
  })
})
```

---

## 🚀 運行測試

### 常見命令

```bash
# 運行所有測試
npm test

# 監視模式（文件改變時自動重新運行）
npm run test:watch

# 生成覆蓋率報告
npm run test:coverage

# 運行特定測試文件
npm test -- src/lib/__tests__/date.test.ts

# 運行與模式匹配的測試
npm test -- --testNamePattern="calculateDaysUntilExpiry"
```

### 覆蓋率輸出

```
-----------|----------|----------|----------|----------|
File      | Stmts    | Branch   | Funcs    | Lines    |
-----------|----------|----------|----------|----------|
All files |   75.2%  |   62.1%  |   68.4%  |   74.8%  |
 date.ts  |   85%    |   82%    |   90%    |   85%    |
 gemini.ts|   78%    |   65%    |   75%    |   77%    |
-----------|----------|----------|----------|----------|
```

---

## 📋 測試檢查清單

在提交代碼前，檢查：

- [ ] 所有現有測試仍然通過：`npm test`
- [ ] 新增代碼有對應單元測試
- [ ] 測試涵蓋主要邏輯和邊界情況
- [ ] Mock 設置正確，不會有副作用
- [ ] 無 `test.skip()` 或 `test.only()` 遺留
- [ ] 測試名稱清晰描述意圖（"should X when Y"）
- [ ] 無硬編碼的測試數據（使用 fixtures）

---

## 🔮 未來測試計劃

### Phase 2：集成測試

```typescript
// 測試完整的 Firebase 流程（無 mock）
describe('Firestore Integration', () => {
  test('should persist and retrieve items from real Firestore', async () => {
    // 真實連接到測試 Firebase 項目
    const item = await createFoodItem(testUserId, {...})

    // 驗證在 Firestore 中存在
    const doc = await getDoc(...)
    expect(doc.exists()).toBe(true)
  })
})
```

### Phase 2+：E2E 測試

```typescript
// Playwright
test('complete user flow: upload photo → confirm → view list', async ({
  page,
}) => {
  await page.goto('http://localhost:3000')

  // 點擊相機按鈕
  await page.click('button[aria-label="拍攝照片"]')

  // 上傳圖片
  await page.setInputFiles('input[type="file"]', 'test-image.jpg')

  // 確認識別結果
  await page.fill('input[name="product_name"]', '義美小泡芙')
  await page.click('button[aria-label="確認"]')

  // 驗證項目出現在清單中
  await expect(page.locator('text=義美小泡芙')).toBeVisible()
})
```

---

## 🆘 常見測試問題

### Q: 如何測試異步函數？
```typescript
test('should handle async operation', async () => {
  const result = await asyncFunction()
  expect(result).toBe('expected-value')
})
```

### Q: 如何 mock 模塊函數？
```typescript
jest.mock('../module')
const { someFunction } = require('../module')
;(someFunction as jest.Mock).mockResolvedValue(value)
```

### Q: 如何測試 throw 錯誤？
```typescript
test('should throw error', () => {
  expect(() => {
    functionThatThrows()
  }).toThrow('Error message')
})

// 或異步
test('should reject', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message')
})
```

### Q: 如何隔離測試（不互相干擾）？
```typescript
beforeEach(() => {
  // 在每個測試前運行
  jest.clearAllMocks()
  // 重置狀態
})

afterEach(() => {
  // 在每個測試後清理
})
```

---

## 📚 資源

- [Jest 官方文檔](https://jestjs.io/)
- [Testing Library 文檔](https://testing-library.com/)
- [TypeScript Jest 類型](https://github.com/microsoft/TypeScript)

---

**最後更新者：** Claude Code (QA 架構師)
**最後更新日期：** 2025-12-17
