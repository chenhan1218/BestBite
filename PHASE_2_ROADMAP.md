# 🚀 BestBite Phase 2+ 路線圖和遷移指南

**目的：** 規劃從 Phase 1（MVP）到後續階段的演進，包括功能、架構升級、和遷移路徑

**Last Updated：** 2025-12-17
**Status：** 規劃中
**Audience：** 產品經理、架構師、工程主管

---

## 📊 功能演進路線圖

```
Phase 1 (當前: ✅ 完成)        Phase 2 (計畫中)        Phase 3 (展望)
└─ MVP 核心功能              └─ 帳號與同步           └─ 社交與通知
   - 拍照識別                   - Firebase Auth         - 分享清單
   - AI 識別                    - 跨設備同步             - 好友功能
   - 本地儲存                   - 離線隊列               - 群組管理
   - 離線支援                   - 數據加密               - API
   - PWA                        - 進階搜尋
                                - 統計儀表板
```

---

## 🎯 Phase 2：完整用戶體驗（估計 2 個月）

### 2.1 用戶認證系統

**目標：** 支持用戶帳號，啟用跨設備數據同步

#### 技術決策

| 決策 | 方案 | 理由 |
|------|------|------|
| 認證 | Firebase Auth | 無伺服器，集成 Firestore |
| 登入方式 | Email + 密碼 + Google | 平衡安全和易用性 |
| 會話管理 | Firebase Token | 自動過期和刷新 |
| 遷移策略 | UUID → Auth ID | Phase 1 數據自動關聯 |

#### 實現步驟

**2.1.1 添加 Firebase Auth 初始化**
```typescript
// src/lib/firebase.ts - 添加 Auth
import { initializeAuth, connectAuthEmulator } from 'firebase/auth'

export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence]
})
```

**2.1.2 創建認證上下文**
```typescript
// src/context/AuthContext.tsx (新文件)
interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  signup(email: string, password: string): Promise<void>
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
  resetPassword(email: string): Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
```

**2.1.3 添加認證頁面**
```typescript
// src/app/auth/page.tsx (新頁面)
// src/app/auth/login/page.tsx
// src/app/auth/signup/page.tsx
// src/components/Auth/LoginForm.tsx
// src/components/Auth/SignupForm.tsx
```

**2.1.4 數據遷移：UUID → Auth ID**
```typescript
// 遷移邏輯
async function migrateUserData(oldUserId: string, newUserId: string) {
  // 1. 複製 Phase 1 的所有數據到新 Auth 用戶
  const items = await readAllFoodItems(oldUserId)
  for (const item of items) {
    await createFoodItem(newUserId, item)
  }

  // 2. 刪除舊的 UUID 用戶數據（可選）
  // await deleteUserData(oldUserId)

  // 3. 更新本地存儲指標
  localStorage.setItem('userId', newUserId)
}

// 觸發時機：首次有帳號登入時
```

**估計工作量：** 2-3 週

#### 驗收標準
- [ ] 用戶可註冊新帳號
- [ ] 用戶可用 Google OAuth 登入
- [ ] Phase 1 數據自動遷移
- [ ] Session 在浏览器重启後保留
- [ ] 登出後數據完整清除

---

### 2.2 跨設備數據同步

**目標：** 用戶在多個設備上登入，數據自動同步

#### 架構改動

```typescript
// 之前（Phase 1）
users/{userId}/
  └── food_items/{itemId}

// 之後（Phase 2）
users/{authUserId}/
  ├── profile/
  │   ├── email
  │   ├── displayName
  │   └── preferences
  └── food_items/{itemId}
      └── (與 Phase 1 相同，但 authUserId 不同)
```

#### 實現步驟

**2.2.1 更新 Firestore 規則**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      match /food_items/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

**2.2.2 啟用 Firestore 離線持久化**
```typescript
// 在 Firebase 初始化時
import { enableIndexedDbPersistence } from 'firebase/firestore'

await enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      // 多個標籤開啟
    } else if (err.code == 'unimplemented') {
      // 瀏覽器不支援
    }
  })
```

**估計工作量：** 1-2 週

#### 驗收標準
- [ ] 不同設備上的數據自動同步（秒級）
- [ ] 設備離線時，數據繼續可用
- [ ] 設備恢復連線時，自動合並遠程更改
- [ ] 無數據丟失或重複

---

### 2.3 離線寫入隊列

**目標：** 用戶在離線時可編輯，恢復連線自動上傳

#### 設計

```typescript
// 新增 Store：offlineQueue
interface OfflineOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  itemId: string
  data: Partial<FoodItem>
  timestamp: number
  status: 'pending' | 'failed'
  retries: number
}

// 流程
用戶編輯（無網路）
  ↓
保存到 offlineQueue
  ↓
UI 顯示「⚠️ 離線模式」
  ↓
恢復網路
  ↓
自動上傳隊列
  ↓
清除隊列，顯示「✅ 已同步」
```

#### 實現

**2.3.1 修改 storage.ts**
```typescript
// 添加新函數
export async function addToOfflineQueue(op: OfflineOperation): Promise<void>
export async function getOfflineQueue(): Promise<OfflineOperation[]>
export async function removeFromQueue(opId: string): Promise<void>
export async function flushOfflineQueue(userId: string): Promise<void>
```

**2.3.2 修改 createFoodItem / updateFoodItem**
```typescript
// 檢測網路，決定直接上傳或入隊
async function createFoodItem(userId: string, input: CreateFoodItemInput) {
  const item = { /* ... */ }

  // 立即保存本地
  await addFoodItemLocal(item)

  if (navigator.onLine) {
    // 有網路：直接上傳
    await uploadToFirestore(userId, item)
  } else {
    // 無網路：入隊
    await addToOfflineQueue({
      type: 'create',
      itemId: item.id,
      data: item,
      // ...
    })
  }
}
```

**2.3.3 網路恢復處理**
```typescript
window.addEventListener('online', () => {
  console.log('網路恢復')
  flushOfflineQueue(currentUserId)
})
```

**估計工作量：** 1 週

#### 驗收標準
- [ ] 離線時編輯被緩存
- [ ] 恢復網路時自動上傳
- [ ] 上傳失敗時重試（指數退避）
- [ ] UI 清楚顯示同步狀態

---

### 2.4 進階搜尋和篩選

**目標：** 用戶能快速找到特定食品

#### 功能

```
搜尋功能：
├─ 按產品名稱搜尋（模糊匹配）
├─ 按過期日期範圍篩選
├─ 按狀態篩選（紅/黃/綠）
├─ 按信心度篩選（AI 識別準確度）
└─ 組合篩選

排序選項：
├─ 按過期日期（近到遠）[默認]
├─ 按新增時間（新到舊）
├─ 按信心度（高到低）
└─ 按產品名稱（A-Z）
```

#### 實現

**2.4.1 添加搜尋和篩選狀態**
```typescript
// src/context/FoodContext.tsx
interface FoodContextValue {
  // ... 既有內容
  filters: {
    searchQuery: string
    dateRange?: [Date, Date]
    status?: Status
    confidence?: number
    sortBy: 'expiry' | 'created' | 'confidence' | 'name'
  }
  setFilters(filters: Partial<FoodContextValue['filters']>): void
}
```

**2.4.2 擴展 firestore.ts**
```typescript
// 添加查詢函數
export async function searchFoodItems(
  userId: string,
  query: SearchQuery
): Promise<FoodItem[]> {
  // 構建 Firestore 複合查詢
  let q = collection(db, 'users', userId, 'food_items')

  if (query.status) {
    q = query(q, where('status', '==', query.status))
  }

  if (query.minConfidence) {
    q = query(q, where('confidence', '>=', query.minConfidence))
  }

  // 排序
  q = query(q, orderBy(query.sortBy, 'asc'))

  return getDocs(q)
}
```

**2.4.3 創建搜尋 UI**
```typescript
// src/components/Inventory/SearchAndFilter.tsx
// - 搜尋框
// - 多個篩選器
// - 排序下拉選單
```

**估計工作量：** 1.5 週

#### 驗收標準
- [ ] 搜尋功能工作正常
- [ ] 篩選邏輯正確
- [ ] 複合篩選結果準確
- [ ] 排序選項全部可用
- [ ] 性能優良（< 100ms 查詢）

---

### 2.5 數據加密（可選）

**目標：** 敏感數據端到端加密

#### 決策

| 方面 | 方案 | 理由 |
|------|------|------|
| 何時加密 | 發送前 + 存儲 | 完全保護 |
| 加密算法 | AES-256-GCM | 標準強度 |
| 密鑰存儲 | 本地生成，無伺服器保存 | 最大隱私 |

#### 實現（進階，可延後）

```typescript
// src/lib/crypto.ts (新文件)
export async function encryptItem(item: FoodItem, password: string): Promise<string>
export async function decryptItem(encrypted: string, password: string): Promise<FoodItem>

// 在創建和讀取時使用
await createFoodItem(userId, await encryptItem(item, userPassword))
```

**估計工作量：** 2-3 週

---

### 2.6 統計儀表板

**目標：** 顯示用戶的食品管理統計

#### 功能

```
主要指標：
├─ 總食品數量
├─ 即將過期（紅燈）數量 + %
├─ 月平均採購量
├─ 常用品牌
└─ 過期率 (已過期 / 總數)

圖表：
├─ 時間序列：每月新增數量
├─ 分類：按狀態分佈（餅圖）
├─ 排行：最常購買品牌（柱狀圖）
└─ 日曆：每日食品變化
```

#### 實現

**2.6.1 添加統計頁面**
```typescript
// src/app/stats/page.tsx
// src/components/Stats/StatsCard.tsx
// src/components/Stats/TrendChart.tsx
```

**2.6.2 添加統計函數**
```typescript
// src/lib/stats.ts (新文件)
export function calculateMetrics(items: FoodItem[]): Stats
export function getTrendByMonth(items: FoodItem[]): TrendData[]
export function getDistributionByStatus(items: FoodItem[]): DistributionData
```

**估計工作量：** 1-2 週

---

### Phase 2 總結

| 任務 | 工作量 | 優先級 | 開始 |
|------|--------|--------|------|
| 2.1 認證系統 | 2-3 週 | 🔴 高 | Week 1 |
| 2.2 跨設備同步 | 1-2 週 | 🔴 高 | Week 2 |
| 2.3 離線隊列 | 1 週 | 🟠 中 | Week 4 |
| 2.4 進階搜尋 | 1.5 週 | 🟡 中 | Week 5 |
| 2.5 數據加密 | 2-3 週 | 🟡 中 | Phase 3 |
| 2.6 統計儀表板 | 1-2 週 | 🟡 中 | Week 6 |
| **總計** | **~8-10 週** | | |

**預計完成：** Q1 2026

---

## 🎯 Phase 3：社交和協作（展望）

### 3.1 分享清單功能

```
功能：
- 生成分享連結（公開/受密碼保護）
- 好友可查看和下載清單
- 實時協作編輯
- 評論和標籤系統
```

### 3.2 群組管理

```
功能：
- 創建家庭/宿舍群組
- 成員邀請和權限管理
- 群組清單（共享購物清單）
- 活動日誌
```

### 3.3 後台推送通知

```
功能：
- 過期日期提醒（1 天、7 天前）
- 群組成員更新通知
- 推薦購買提示
```

---

## 🔧 技術升級清單

### 依賴升級

| 包 | 當前 | 目標 | 優先級 | 理由 |
|------|------|------|--------|------|
| Next.js | 15.5 | 16.0+ | 🟡 中 | 新功能，等待穩定 |
| React | 19.0 | 19.x | 🟢 低 | 當前已是最新 |
| Firebase | 12.6 | 12.7+ | 🟡 中 | 安全更新 |
| Tailwind | 3.4 | 4.0+ | 🟢 低 | 新特性，可延遲升級 |
| TypeScript | 5.3 | 5.5+ | 🟢 低 | 點更新 |

### 工具添加

| 工具 | 用途 | 優先級 |
|------|------|--------|
| Playwright | E2E 測試 | 🟠 中 |
| Sentry | 錯誤追蹤 | 🟠 中 |
| Vercel Analytics | 性能監控 | 🟡 低 |
| Firebase Security Rules 測試 | 規則驗證 | 🟠 中 |

---

## 📋 遷移檢查清單

### Phase 1 → Phase 2 遷移

當準備升級時，檢查：

**功能遷移**
- [ ] 認證系統已測試
- [ ] 用戶數據遷移腳本已驗證
- [ ] 跨設備同步功能已驗證
- [ ] 離線隊列測試通過

**數據遷移**
- [ ] 備份所有 Phase 1 數據
- [ ] 遷移腳本已在測試環境驗證
- [ ] 回滾計劃已準備
- [ ] 用戶溝通計畫已制定

**性能驗證**
- [ ] 新功能性能基準已建立
- [ ] 沒有性能衰退
- [ ] 網路延遲可接受
- [ ] 本地存儲大小在控制內

**質量保證**
- [ ] 所有新功能單元測試覆蓋
- [ ] 集成測試通過
- [ ] 手動 QA 完成
- [ ] 帳號轉移測試通過

**佈署準備**
- [ ] Firebase 規則已更新
- [ ] 環境變數已配置
- [ ] 監控和日誌已設置
- [ ] 文檔已更新

---

## 🎓 開發指南

### 添加新功能時

1. **評估複雜度** - 確定影響範圍
2. **更新架構** - 修改 DESIGN_DECISIONS.md
3. **更新類型** - 添加必要的 TypeScript 接口
4. **編寫測試** - 先寫測試再實現
5. **實現功能** - 遵循代碼組織規範
6. **更新文檔** - CODE_ORGANIZATION.md 等

### 發佈新版本時

```bash
# 版本號格式：MAJOR.MINOR.PATCH
# Phase 1 結束版本：1.0.0
# Phase 2 開始版本：2.0.0（重大升級，可能破壞兼容）

npm version major  # 2.0.0
git tag v2.0.0
git push origin v2.0.0

# 更新 package.json 中的版本和發佈說明
```

---

## 📚 參考資源

- [Next.js 升級指南](https://nextjs.org/docs/upgrading)
- [Firebase 遷移指南](https://firebase.google.com/docs/auth/web/migration)
- [Firestore 最佳實踐](https://firebase.google.com/docs/firestore/best-practices)
- [Web 安全最佳實踐](https://owasp.org/www-project-web-security-testing-guide/)

---

## 🔔 重要提醒

### 何時開始 Phase 2

等待以下條件：

✅ **技術就緒**
- Next.js 16 穩定 2+ 月
- Firebase Auth 測試完成
- 離線隊列設計確認

✅ **產品就緒**
- Phase 1 功能完全穩定
- 用戶反饋收集完成
- 市場需求確認

✅ **團隊就緒**
- 團隊規模足夠（2+ 開發者）
- 測試基礎設施就緒
- 監控和告警系統準備好

---

**最後更新者：** Claude Code (產品架構師)
**最後更新日期：** 2025-12-17
**下次審核日期：** 2026-Q1
