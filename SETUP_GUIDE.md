# BestBite 開發環境設置指南

## 前置準備

### 1. 環境變數配置

複製範本檔案並填入你的憑證：

```bash
cp .env.local.example .env.local
```

編輯 `.env.local` 並填入以下信息：

#### Firebase Configuration
前往 [Firebase Console](https://console.firebase.google.com/)：
1. 選擇你的專案 → Project Settings
2. 在 "Your apps" 區域找到你的 Web app
3. 複製配置物件中的值填入：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your-project-id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-app-id>
```

#### Gemini API Key
前往 [Google AI Studio](https://ai.google.dev/)：
1. 點擊 "Get API key"
2. 建立新的 API key
3. 複製到 `.env.local`：

```env
GEMINI_API_KEY=<your-gemini-key>
```

### 2. Firebase 專案配置

#### Firestore Database
1. Firebase Console → Firestore Database → Create Database
2. 選擇 "Start in test mode" (開發用；生產前更改規則)
3. 選擇最近的區域

#### Firebase Storage
1. Firebase Console → Storage → Get Started
2. 選擇預設區域
3. 規則參考 `firestore.rules` 文件

#### Firestore Security Rules
1. Firebase Console → Firestore Database → Rules tab
2. 複製 `firestore.rules` 文件內容
3. 點擊 Publish

### 3. 本地開發環境

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 訪問 http://localhost:3000
```

---

## 🧪 測試環境設置

### 選項 A: Jest Mock (推薦用於階段 1-3)

**優點：** 快速、無外部依賴、易於控制
**缺點：** 無法測試真實 Firestore 行為

```bash
# 運行所有測試
npm run test

# Watch 模式
npm run test:watch

# 檢查覆蓋率
npm run test:coverage
```

Jest 配置已在 `jest.config.js` 完成。

### 選項 B: Firebase Emulator Suite (推薦用於階段 5)

**優點：** 真實 Firebase 環境；本地離線開發
**缺點：** 需要 Java；setup 複雜

#### 安裝 Firebase Emulator

```bash
# 全局安裝 Firebase CLI
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化 Firebase project (如尚未)
firebase init emulators

# 啟動本地模擬器
firebase emulators:start
```

#### 使用 Emulator

模擬器會在以下端口運行：
- **Firestore:** http://localhost:8080
- **Storage:** http://localhost:9199
- **Emulator Suite UI:** http://localhost:4000

在開發代碼中指向本地模擬器：

```typescript
// src/lib/firebase.ts
import { connectFirestoreEmulator } from 'firebase/firestore'

const db = getFirestore(app)

// 只在開發環境連接模擬器
if (process.env.NODE_ENV === 'development' && !isAlreadyConnected()) {
  connectFirestoreEmulator(db, 'localhost', 8080)
}
```

---

## 📋 常用指令

```bash
# 開發
npm run dev              # 啟動開發伺服器

# 測試
npm run test             # 執行所有測試
npm run test:watch      # Watch 模式
npm run test:coverage   # 覆蓋率報告

# 構建 & 生產
npm run build            # 生產環境構建
npm start                # 啟動生產伺服器

# 程式碼品質
npm run lint             # ESLint 檢查
npm run lint:fix         # 自動修復 lint 問題
```

---

## 🔍 常見問題

### Q1: `.env.local` 中環境變數未被讀取

**A:** Next.js 只在啟動時讀取環境變數。請重啟開發伺服器：
```bash
# 停止現有伺服器 (Ctrl+C)
npm run dev
```

### Q2: Firebase 認證失敗

**A:** 檢查以下項目：
1. `.env.local` 中的 credentials 是否正確複製
2. Firebase 專案是否已建立 Firestore Database 和 Storage
3. Firestore Security Rules 是否已發佈

### Q3: Gemini API 返回 401 Unauthorized

**A:**
1. 確認 `GEMINI_API_KEY` 正確
2. 檢查 API key 是否已啟用（Google Cloud Console）
3. 檢查 API quota 是否已用盡

### Q4: IndexedDB 在測試中不可用

**A:** Jest 使用 jsdom 環境。IndexedDB 在測試中需要 mock：
```typescript
// 在測試中 mock IndexedDB
import 'fake-indexeddb/auto'  // 自動 polyfill
```

---

## 📝 下一步

1. 填入 `.env.local` 所有必要的環境變數
2. 在 Firebase Console 發佈 Firestore Security Rules
3. 執行 `npm run dev` 確認開發伺服器能啟動
4. 執行 `npm run test` 確認測試環境正常

根據 `IMPLEMENTATION_PLAN.md` 開始實現階段 1！

---

**Last Updated:** 2025-12-17
