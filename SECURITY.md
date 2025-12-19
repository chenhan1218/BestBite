# 安全審查記錄 (Security Review)

**最後更新：** 2025-12-19
**審查者：** Claude Code (Haiku 4.5)
**狀態：** 待改進

---

## 執行摘要

BestBite 是一個食品庫存管理 PWA，核心流程涉及用戶圖片上傳、AI 辨識、數據存儲。本次安全審查發現 **2 個 CRITICAL 級別問題** 和 **6 個 MEDIUM 級別問題**，主要關乎用戶認證、數據存儲授權和 API 防護。

### 風險評分
- **整體風險等級：** 🔴 **HIGH**（未實現真正認證）
- **數據洩露風險：** 🔴 **HIGH**（Firestore 規則未配置）
- **成本超支風險：** 🟠 **MEDIUM**（API 無限制）

---

## 發現的安全問題

### 🔴 CRITICAL - 1. 缺乏真正的用戶認證

**位置：** `src/lib/firebase.ts` - `getOrCreateUserID()`

**問題：**
```typescript
// 當前實現 - 不安全
const existingUserID = localStorage.getItem('bestbite_user_id')
if (existingUserID) return existingUserID

const newUserID = generateUUID()
localStorage.setItem('bestbite_user_id', newUserID)
return newUserID
```

**風險：**
1. ❌ 任何人可偽造 userID 存取他人數據
2. ❌ 無法驗證用戶身份
3. ❌ 跨設備無法識別同一用戶
4. ❌ 無法實現帳號刪除、數據恢復
5. ❌ 攻擊者可枚舉所有 userID 並竊取數據

**改進方案：** 實現 Firebase Anonymous Auth
- 🔗 [Firebase Auth 文檔](https://firebase.google.com/docs/auth/web/anonymous-auth)
- 安全性由 Firebase 負責
- 跨設備自動同步
- 支持後續升級到郵箱/社交登入

**優先級：** 🔴 **立即實施**

---

### 🔴 CRITICAL - 2. Firebase Security Rules 未配置

**位置：** Firebase Console (外部，非代碼)

**問題：**
```typescript
// 數據安全完全依賴路徑中的 userID，無規則驗證
const path = `users/${userId}/food_items`
```

**風險：**
1. ❌ Firestore 可能允許任意讀寫
2. ❌ Storage 圖片可被公開訪問
3. ❌ 無法強制用戶只存取自己的數據
4. ❌ 任何人可通過 SDK 繞過應用邏輯

**改進方案：** 部署 Firestore 和 Storage 安全規則

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /food_items/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/images/{itemId}.jpg {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**優先級：** 🔴 **立即實施** (必須與認證一起部署)

---

### 🟠 HIGH - 3. API 無速率限制

**位置：** `src/app/api/gemini/route.ts`

**問題：**
```typescript
// ❌ 完全無限制，任何人可發送無限請求
export async function POST(request: NextRequest) {
  // ... 無速率檢查
}
```

**風險：**
1. ❌ 攻擊者可耗盡 Gemini API 配額
2. ❌ 導致巨額 API 費用
3. ❌ DDoS 攻擊風險
4. ❌ 無法追蹤濫用者

**改進方案：** 實現速率限制
- 推薦：使用 `@upstash/ratelimit`（免費層充足）
- 替代：簡單的內存速率限制（不適合分散式部署）

**預期配置：**
- 每小時 10 個請求/IP
- 返回 429 Too Many Requests
- 在日誌中記錄濫用者

**優先級：** 🟠 **本週內**

---

### 🟠 HIGH - 4. 錯誤訊息泄露敏感信息

**位置：** `src/app/api/gemini/route.ts` 和 `src/lib/gemini.ts`

**問題：**
```typescript
// ❌ 直接返回 Gemini API 內部錯誤
console.error('Gemini API error:', errorData)
return NextResponse.json(
  { error: `Gemini API error: ${errorData.error?.message}` },
  { status: geminiResponse.status }
)
```

**風險：**
1. ❌ 暴露使用的 AI 服務（Gemini）
2. ❌ 洩露 API 限制和配額信息
3. ❌ 助於攻擊者定向攻擊
4. ❌ 用戶可看到系統內部詳情

**改進方案：** 規範化客戶端錯誤訊息
```typescript
// ✅ 詳細訊息只在開發環境和服務器日誌顯示
if (process.env.NODE_ENV === 'development') {
  console.error('Detailed error:', error)
}
// ✅ 返回通用訊息給客戶端
return NextResponse.json(
  { error: '處理圖片時出錯，請稍候後重試' },
  { status: 500 }
)
```

**優先級：** 🟠 **本週內**

---

### 🟡 MEDIUM - 5. CORS 和 CSP 安全頭未配置

**位置：** `next.config.js` (需補充)

**問題：** 使用 Next.js 預設設置，可能過於寬鬆

**風險：**
1. 🟡 Clickjacking 攻擊
2. 🟡 MIME 嗅探導致 XSS
3. 🟡 資源加載無限制

**改進方案：** 配置安全頭
```javascript
// next.config.js
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' https://firebaseapp.com https://generativelanguage.googleapis.com",
      },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    ],
  },
]
```

**優先級：** 🟡 **下週**

---

### 🟡 MEDIUM - 6. Gemini API 密鑰在 URL 查詢字符串

**位置：** `src/app/api/gemini/route.ts` 第 ~25 行

**問題：**
```typescript
// ❌ 密鑰在 URL 中 - 可被代理、日誌、歷史記錄捕獲
const url = `${geminiApiUrl}?key=${geminiApiKey}`
const response = await fetch(url, { method: 'POST' })
```

**風險：**
1. 🟡 密鑰可能被 Web 伺服器日誌記錄
2. 🟡 代理或 CDN 日誌可能記錄密鑰
3. 🟡 瀏覽器歷史記錄無關，但代理層有風險

**改進方案：** 使用 HTTP Header 傳遞
```typescript
// ✅ 使用 x-goog-api-key header (Google 支持)
const response = await fetch(geminiApiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': geminiApiKey,
  },
  body: JSON.stringify(requestBody),
})
```

**優先級：** 🟡 **下週**

---

### 🟡 MEDIUM - 7. IndexedDB 數據未加密

**位置：** `src/lib/storage.ts`

**問題：**
```typescript
// ❌ 所有離線數據明文存儲
const transaction = db.transaction(['food_items'], 'readwrite')
const store = transaction.objectStore('food_items')
store.put(foodItem)  // 未加密
```

**風險：**
1. 🟡 XSS 攻擊可直接讀取所有本地敏感數據
2. 🟡 設備上其他應用可能訪問數據
3. 🟡 Browser 重置時數據不被安全清除

**改進方案：** 使用 `libsodium.js` 加密
```bash
npm install libsodium.js
```

建立加密層：
```typescript
// src/lib/encryption.ts
export class StorageEncryption {
  static encrypt(data: string, userUID: string): string {
    // 用 Firebase UID 作為密碼派生加密密鑰
  }

  static decrypt(encryptedData: string, userUID: string): string {
    // 解密數據
  }
}
```

修改存儲：
```typescript
// ✅ 儲存前加密
const encrypted = StorageEncryption.encrypt(
  JSON.stringify(foodItem),
  userUID
)
store.put({ id: itemId, encrypted })
```

**優先級：** 🟡 **下個月** (在完成認證後)

---

### 🟡 MEDIUM - 8. 依賴包安全審計未自動化

**位置：** `package.json` 和 CI/CD

**問題：** 無法確認依賴是否有已知漏洞

**改進方案：**
```bash
# 本地檢查
npm audit
npm audit fix

# CI/CD 自動化（GitHub Actions）
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm audit --audit-level=moderate
```

**優先級：** 🟡 **持續進行**

---

## 改進清單 (實施順序)

### 第一階段：CRITICAL (立即)
- [ ] 實現 Firebase Anonymous Authentication
- [ ] 部署 Firestore Security Rules
- [ ] 部署 Storage Security Rules

### 第二階段：HIGH (本週)
- [ ] 添加 API 速率限制 (`@upstash/ratelimit`)
- [ ] 規範化錯誤處理，避免信息洩露
- [ ] 測試：驗證沒有敏感信息在錯誤訊息中

### 第三階段：MEDIUM (下週)
- [ ] 配置 CORS 和 CSP 安全頭
- [ ] 修復 Gemini API 調用，用 Header 傳遞 API 密鑰
- [ ] 代碼審查：確認無其他硬編碼密鑰

### 第四階段：MEDIUM (下個月)
- [ ] 實現 IndexedDB 加密層
- [ ] 在 GitHub Actions 添加 `npm audit` 檢查
- [ ] 建立定期安全審查流程（月度）

---

## 現有的安全優勢 ✅

1. **輸入驗證** - 圖片類型、大小、尺寸檢查完善
2. **JSON 驗證** - Gemini 響應結構驗證
3. **日期格式驗證** - YYYY-MM-DD 強制執行
4. **字段長度限制** - 產品名稱限制 100 字符
5. **Singleton 模式** - Firebase 初始化安全
6. **錯誤處理** - 基本的 try-catch 和 HTTP 狀態碼
7. **離線支援** - IndexedDB 作為備份存儲
8. **TypeScript** - 類型安全

---

## 無法在代碼中驗證的項目

以下項目需要在 Firebase Console 中驗證/配置：

1. **Firestore Security Rules** - 檢查：[Firebase Console](https://console.firebase.google.com) → Firestore → Rules
2. **Storage Security Rules** - 檢查：Firebase Console → Storage → Rules
3. **Authentication 配置** - 檢查：Firebase Console → Authentication → Providers
4. **API Key 限制** - 在 Google Cloud Console 設置 API 密鑰限制
5. **CORS 配置** - 檢查 Vercel 部署設置

---

## 詞彙表

| 術語 | 說明 |
|------|------|
| **Firebase Auth** | Google 提供的身份認證服務 |
| **Security Rules** | Firestore/Storage 的存取控制規則 |
| **Rate Limiting** | 限制用戶在一定時間內的請求次數 |
| **CSP** | Content Security Policy，限制網站資源加載 |
| **XSS** | Cross-Site Scripting，注入型攻擊 |
| **IndexedDB** | 瀏覽器本地數據庫 |
| **libsodium** | 加密函數庫 |

---

## 相關文檔

- 📄 `CLAUDE.md` - Claude Code 工作指南
- 📄 `ARCHITECTURE.md` - 系統架構設計
- 📄 `DEVELOPMENT_GUIDE.md` - 開發指南
- 📄 `PROJECT_PLAN.md` - 產品規格

---

## 聯繫與支持

未來 Claude Code 與此 repo 協作時，應參考本文檔制定優先級和實施計劃。

**本審查由 Claude Code (Haiku 4.5) 在 2025-12-19 執行。**
