# 📡 BestBite 離線優先策略文檔

**目的：** 詳解 IndexedDB + Firestore 雙層存儲架構和實時同步機制

**Last Updated：** 2025-12-17
**Audience：** 系統架構師、後端開發者、性能優化人員

---

## 🎯 設計目標

```
用戶在任何網路狀態下都能使用應用：
┌─────────────────────────────────────┐
│ 有網路：快速 + 雲備份              │
│ 無網路：完全本地，等待連線         │
│ 弱網路：樂觀更新 + 自動重試        │
└─────────────────────────────────────┘
```

### 核心原則

1. **樂觀更新** - 立即反映 UI，後台同步
2. **離線優先** - IndexedDB 是首選讀取源
3. **雲優先** - Firestore 是數據真實源
4. **自動同步** - 無需用戶幹預
5. **衝突解決** - Firestore 優先（最新）

---

## 🏗️ 雙層存儲架構

```
┌────────────────────────────────────────────┐
│         React Components (UI)               │
│                                              │
└─────────────────────┬──────────────────────┘
                      │
         ┌────────────▼────────────┐
         │   FoodContext (State)    │  ← 應用狀態
         │   [foodItems: Array]    │
         └────────────┬────────────┘
                      │
          ┌───────────┼───────────┐
          │           │           │
    ┌─────▼─────┐ ┌──▼────┐ ┌────▼──────┐
    │  Cache    │ │Realtime│ │ Write     │
    │  Layer    │ │Listener│ │ Operations
    │(IndexedDB)│ │(onSnap)│ │(add/update)
    │           │ │        │ │
    │ Fast Read │ │Updates │ │→ Backend
    │ Full Copy │ │        │ │
    └─────┬─────┘ └────────┘ └────┬──────┘
          │                        │
    ┌─────▼────────────────────────▼─────┐
    │    Firebase Services (Backend)      │
    ├─────────────────────────────────────┤
    │ Firestore (NoSQL Database)          │
    │ Storage (File Storage)              │
    │ Auth (Future: User Accounts)        │
    └─────────────────────────────────────┘
```

---

## 💾 IndexedDB 架構

### 數據庫結構

```javascript
Database: "BestBiteDB" (version: 1)

// Object Store 1: food_items（主要數據）
store: {
  keyPath: 'id',           // 主鍵
  indexes: [
    { name: 'expiry_date', keyPath: 'expiry_date', unique: false },
    { name: 'status', keyPath: 'status', unique: false },
    { name: 'created_at', keyPath: 'created_at', unique: false }
  ]
}

// Object Store 2: metadata（系統狀態）
store: {
  keyPath: 'key',           // 如 'lastSync'
  // 用於追蹤同步狀態
}
```

### 數據項結構

```typescript
interface FoodItem {
  // 主鍵和身份
  id: string                    // Firestore doc ID，主鍵

  // 食品信息
  product_name: string         // "義美小泡芙"
  expiry_date: string         // YYYY-MM-DD 格式
  days_until_expiry: number   // 緩存計算結果（提升查詢速度）
  status: 'red' | 'yellow' | 'green'  // 緩存狀態（提升查詢速度）

  // 圖片
  image_url: string           // Firebase Storage URL

  // 元數據
  confidence: number          // 0-100 AI 信心度
  created_at: Date            // 創建時間
  updated_at: Date            // 最後編輯時間

  // 同步控制（未來擴展）
  _synced?: boolean          // 是否已同步到雲
  _error?: string             // 同步錯誤信息
}
```

### 索引策略

**為什麼需要索引？**
```
查詢場景：
1. 按過期日期排序             → 索引：expiry_date
2. 按狀態篩選（紅/黃/綠）      → 索引：status
3. 按創建時間序列              → 索引：created_at
```

**索引對比：**
```
無索引查詢：O(n) = 掃描所有 1000 項
有索引查詢：O(log n) = 毫秒級查詢

示例：
- getAllFoodItems() → scan（無索引）→ 快但全加載
- getFoodItemsByStatus('red') → 使用 status 索引 → 快 + 部分加載
```

---

## 🔄 數據同步流程

### 流程 1：用戶新增食品（添加流程）

```
用戶點擊「確認」
    ↓
[前端] createFoodItem(userId, input)
    ↓
1️⃣ 立即寫入 IndexedDB
    ├─ 生成臨時 ID（如需）
    ├─ 計算 days_until_expiry
    ├─ 分配 status
    └─ UI 立即更新 ✅

2️⃣ 後台上傳圖片到 Storage
    └─ 獲得 image_url

3️⃣ 後台保存到 Firestore
    ├─ 使用真實 Firestore ID
    └─ 包含圖片 URL

4️⃣ Firestore Listener 監聽變更
    └─ 更新 IndexedDB （同步 Firestore ID）

5️⃣ UI 刷新（如果 ID 改變）
    └─ 切換臨時 ID → 真實 ID
```

**代碼實現：**
```typescript
export async function createFoodItem(
  userId: string,
  input: CreateFoodItemInput
): Promise<FoodItem> {
  const item: FoodItem = {
    id: generateId(),  // 臨時 ID
    product_name: input.product_name,
    expiry_date: input.expiry_date,
    days_until_expiry: calculateDaysUntilExpiry(input.expiry_date),
    status: getFoodStatus(calculateDaysUntilExpiry(input.expiry_date)),
    // ...
  }

  // 1️⃣ 樂觀更新：立即保存本地
  await addFoodItemLocal(item)

  // 2️⃣ 後台同步：上傳圖片
  let imageUrl = input.image_url || ''
  if (input.imageFile) {
    imageUrl = await uploadImageToStorage(userId, item.id, input.imageFile)
  }

  // 3️⃣ 後台同步：保存到 Firestore
  try {
    const docRef = await addDoc(
      collection(db, 'users', userId, 'food_items'),
      {
        product_name: item.product_name,
        expiry_date: item.expiry_date,
        image_url: imageUrl,
        confidence: input.confidence,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }
    )

    // 4️⃣ 更新本地：使用真實 Firestore ID
    item.id = docRef.id
    await updateFoodItemLocal(item.id, { id: docRef.id })

    return item
  } catch (error) {
    console.error('[Firestore] Failed to save:', error)
    // 本地数据仍保留，標記為待同步
    return item
  }
}
```

### 流程 2：應用啟動時的同步

```
應用啟動
    ↓
[前端] 讀取 IndexedDB 中的 lastSyncTime
    ↓
情況 1: 從未同步
    ├─ 全量同步 Firestore 所有數據
    └─ 覆蓋 IndexedDB
    ↓
情況 2: 上次同步 < 5 分鐘
    ├─ 使用本地 IndexedDB 數據
    └─ 後台靜默同步（無 UI 阻塞）
    ↓
情況 3: 無網路
    ├─ 使用本地 IndexedDB 數據
    └─ UI 提示「離線模式」

[後台任務] 建立 Firestore Listener
    ├─ onSnapshot(queryForUserId)
    └─ 監聽所有遠程變更，自動更新本地
```

**代碼實現：**
```typescript
export async function initFoodItemsSync(userId: string): Promise<void> {
  // 1. 從本地讀取
  const localItems = await getAllFoodItemsLocal()
  updateContextState(localItems)

  // 2. 檢查是否需要同步
  const lastSync = await getLastSyncTime()
  const now = Date.now()

  if (!lastSync || now - lastSync > 5 * 60 * 1000) {
    // 超過 5 分鐘，執行同步
    await syncFromFirestore(userId)
  }

  // 3. 建立實時監聽（始終運行）
  setupFirestoreListener(userId)
}

function setupFirestoreListener(userId: string): void {
  const q = query(
    collection(db, 'users', userId, 'food_items'),
    orderBy('expiry_date', 'asc')
  )

  onSnapshot(q, async (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const data = change.doc.data()

      if (change.type === 'added' || change.type === 'modified') {
        // 更新本地副本
        await updateFoodItemLocal(change.doc.id, data)
      } else if (change.type === 'removed') {
        await deleteFoodItemLocal(change.doc.id)
      }
    })

    // 更新同步時間
    await setLastSyncTime(Date.now())
  })
}
```

### 流程 3：編輯食品項

```
用戶編輯產品名稱
    ↓
[前端] updateFoodItem(userId, itemId, updates)
    ↓
1️⃣ 立即更新 IndexedDB
    └─ UI 立即反映 ✅

2️⃣ 後台更新 Firestore
    ├─ 只發送變更欄位（部分更新）
    └─ 伺服器時間戳自動更新

3️⃣ Firestore Listener 監聽
    └─ 同步回 IndexedDB（確保一致性）
```

### 流程 4：刪除食品項

```
用戶長按刪除項目
    ↓
[前端] deleteFood Item(userId, itemId)
    ↓
1️⃣ 顯示確認對話框
    └─ 用戶確認或取消

2️⃣ 確認後：立即刪除本地
    └─ 從 IndexedDB 刪除
    └─ UI 移除項目 ✅

3️⃣ 後台刪除遠程
    ├─ 從 Firestore 刪除文檔
    ├─ 從 Storage 刪除圖片
    └─ 若失敗：恢復本地

4️⃣ Firestore Listener 監聽
    └─ 確認刪除
```

---

## 🌐 網路狀態處理

### 檢測網路連接

```typescript
// 方法 1：瀏覽器 API
function setupNetworkListener(): void {
  window.addEventListener('online', () => {
    console.log('[Network] Online')
    // 恢復同步
    triggerSync()
  })

  window.addEventListener('offline', () => {
    console.log('[Network] Offline')
    // 通知用戶
    showOfflineNotification()
  })
}

// 方法 2：檢查連接狀態
function isOnline(): boolean {
  return navigator.onLine
}
```

### 四種網路狀態下的行為

| 狀態 | 讀取 | 寫入 | 同步 |
|------|------|------|------|
| **在線** | Firestore (優先) | 即時推送 | 立即 |
| **弱網** | IndexedDB | 排隊重試 | 自動重試 |
| **離線** | IndexedDB (唯一) | 本地存儲 | 無 |
| **恢復** | 刷新 Firestore | 上傳隊列 | 全量同步 |

### 離線寫入隊列（規劃）

```typescript
// 未來擴展：Firestore 的離線持久性
// 當前版本暫無實現，手動重試

interface OfflineOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  userId: string
  itemId: string
  data: any
  timestamp: number
  retries: number
}

// 存儲在 IndexedDB 的第三個 Store
const OFFLINE_QUEUE_STORE = 'offlineQueue'

// 恢復網路時
async function flushOfflineQueue(): Promise<void> {
  const operations = await getOfflineOperations()

  for (const op of operations) {
    try {
      await executeOperation(op)
      await removeOfflineOperation(op.id)
    } catch (error) {
      op.retries++
      if (op.retries > 3) {
        // 放棄此操作
        notifyUserOfSyncFailure(op)
      }
    }
  }
}
```

---

## ⚙️ 衝突解決策略

### 場景：同時編輯

```
用戶 A (本地編輯)          用戶 B (遠程編輯)
    ↓                          ↓
IndexedDB 更新 ✅      Firestore 更新 ✅
    ↓                          ↓
推送到 Firestore               (Firestore 現已改變)
    ↓
Listener 收到遠程變更
    ↓
本地 vs 遠程衝突 ⚠️
```

### 衝突解決規則

**當前實現：Firestore 優先（最後寫入勝）**

```typescript
// 衝突解決邏輯
function resolveConflict(
  local: FoodItem,
  remote: FoodItem
): FoodItem {
  // 規則：遠程（Firestore）更新時間更新，優先使用
  if (remote.updated_at > local.updated_at) {
    // 使用遠程數據
    return remote
  } else {
    // 本地更新更新，保留本地
    return local
  }
}

// 在 Firestore Listener 中應用
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'modified') {
      const remoteItem = change.doc.data()
      const localItem = getFromLocalMemory(change.doc.id)

      if (localItem && localItem.updated_at !== remoteItem.updated_at) {
        // 衝突檢測
        const resolved = resolveConflict(localItem, remoteItem as FoodItem)
        updateLocalWithResolved(resolved)
        notifyUserIfDataChanged()
      }
    }
  })
})
```

### 改進方案（Phase 2+）

```typescript
// 方案 1：用戶選擇
// 衝突時，UI 彈出對話框讓用戶選擇

// 方案 2：智能合並
// 對於不同欄位的修改，智能合並
resolveConflictSmart(local, remote) {
  return {
    product_name: local.product_name,  // 本地改動
    expiry_date: remote.expiry_date,   // 遠程改動
    ...  // 不衝突的欄位都保留
  }
}

// 方案 3：版本控制
// 記錄歷史，允許回滾
```

---

## 🚀 性能優化

### 加載性能

```javascript
// 速度對比（估計）

// ❌ 不優化：每次都讀 Firestore
// 時間：2-3秒（網路延遲）
const items = await getDocsFromFirestore(userId)

// ✅ 優化後：首先讀 IndexedDB，後台同步
// 時間：0.1-0.2秒（本地讀取）+ 後台無阻塞同步
const items = await getDocsFromIndexedDB(userId)
refreshFromFirestoreInBackground(userId)
```

### 查詢性能

```typescript
// 有索引 vs 無索引

// ❌ 無索引：O(n) 掃描
const redItems = items.filter(i => i.status === 'red')
// 1000 項 = 掃描所有 1000 項

// ✅ 有索引：O(log n)
const redItems = await db.from('food_items')
  .where('status', '==', 'red')
  .toArray()
// 1000 項，100 項紅燈 = 快速查詢
```

### 存儲空間

```
典型用戶的數據量：
- 平均 50-100 食品項（1 年內有效期）
- 每項 ~0.5KB（JSON）
- 總計 ~50KB

// IndexedDB 極限：
- 最小：50MB（手機）
- 最大：1GB+（桌機）

→ 我們的使用量 << 極限，完全沒問題
```

---

## 🔐 離線安全考慮

### 數據隱私

✅ **優點：**
- 數據完全本地，無雲端持續存儲
- 用戶清除瀏覽器數據 → 本地數據消失
- 多個瀏覽器/設備獨立（暫無雲同步跨設備）

⚠️ **風險：**
- 任何人用同一設備可訪問 IndexedDB
- 解決：Phase 2 添加帳號和加密

### 數據完整性

```typescript
// 防止數據損壞：
1. 驗證 JSON 結構
2. 類型檢查
3. 日期格式驗證

// 防止版本不相容：
IndexedDB versioning
db.version = 1  // 升級時增加版本號

onupgradeneeded = (event) => {
  const oldVersion = event.oldVersion
  const newVersion = event.newVersion

  if (oldVersion < 2) {
    // 執行遷移
  }
}
```

---

## 📋 離線功能檢查清單

在 Phase 2 實現時，確保：

- [ ] 離線讀取完全工作（無網路查看清單）
- [ ] 離線寫入隊列（無網路時緩存編輯）
- [ ] 恢復連線自動同步
- [ ] 衝突解決機制（同時編輯處理）
- [ ] 同步進度指示（UI 顯示同步狀態）
- [ ] 錯誤恢復（同步失敗通知用戶）
- [ ] 存儲配額管理（定期清理舊數據）

---

## 🔮 未來擴展

### Phase 2
- [ ] Firebase Offline Persistence（官方方案）
- [ ] Firestore 加密（客戶端加密）
- [ ] 跨設備同步（帳號綁定）

### Phase 3
- [ ] Service Worker 增強（後台同步）
- [ ] 推送通知（過期提醒）
- [ ] 數據備份和恢復

### Phase 4
- [ ] P2P 同步（設備間共享）
- [ ] 衝突解決 UI（用戶選擇）

---

## 📚 資源

- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Firebase Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Firestore 最佳實踐](https://firebase.google.com/docs/firestore/best-practices)

---

**最後更新者：** Claude Code (系統架構師)
**最後更新日期：** 2025-12-17
