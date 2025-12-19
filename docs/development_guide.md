# BestBite 開發工作指南

## 🎯 給下一個 Claude Code 會話的指南

當你啟動 Claude Code 時，使用以下提示詞快速恢復上下文：

> "我正在開發一個名為 BestBite 的食品庫存管理 PWA。請參考 PROJECT_PLAN.md 了解完整的項目概述、技術棧和設計原則。我們的下一步是 [具體任務]。請擔任資深全端架構師，確保代碼符合設計文檔的所有規格。"

---

## 📖 快速開始 (Quick Start)

### 1. 項目初始化 (如果尚未初始化)

```bash
cd /home/chenhan/git/BestBite

# 初始化 Next.js 15
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-git \
  --eslint \
  --import-alias '@/*'

# 安裝依賴
npm install

# 安裝額外依賴
npm install firebase @google/generative-ai
npm install -D next-pwa sharp

# 啟動開發伺服器
npm run dev
```

### 2. Firebase 項目設置

1. 訪問 [Firebase Console](https://console.firebase.google.com)
2. 建立新項目或選擇現有項目
3. 啟用 **Firestore Database** (生產模式)
4. 啟用 **Storage** (用於上傳圖片)
5. 複製 Firebase 配置到 `.env.local`

### 3. Gemini API 設置

1. 訪問 [Google AI Studio](https://ai.google.dev)
2. 建立或選擇 Google Cloud 項目
3. 啟用 Generative AI API
4. 獲取 API Key，添加到 `.env.local`

---

## 🔄 當前工作流程

### 檢查項目狀態

```bash
# 檢查已完成的任務
cat PROJECT_PLAN.md  # 查看詳細規劃
cat DEVELOPMENT_GUIDE.md  # 查看本指南

# 檢查代碼結構
ls -la src/

# 查看待辦事項
cat TODO.md  # (如果存在)
```

### 確定下一步工作

根據以下優先級順序選擇：

1. **階段 1 完成了嗎？** (Next.js + Firebase 初始化)
   - 如果否 → 執行 `npm install` 和 Firebase 設置
   - 如果是 → 進入階段 2

2. **階段 2 完成了嗎？** (相機 UI)
   - 檢查 `src/app/page.tsx` 是否存在完整的相機按鈕 UI
   - 檢查 `src/components/Camera/` 資料夾是否有相關組件

3. **後續階段**
   - 遵循 PROJECT_PLAN.md 中的「實現階段與里程碑」部分

---

## 🛠️ 常見命令

```bash
# 開發環境
npm run dev          # 啟動開發伺服器 (localhost:3000)

# 編譯和部署
npm run build        # 生產構建
npm start            # 啟動生產伺服器

# 代碼品質
npm run lint         # 檢查 ESLint
npm run lint:fix     # 自動修復 ESLint 問題

# 清理和重啟
rm -rf .next node_modules
npm install
npm run dev
```

---

## 📝 提交代碼時的檢查清單

在每次提交前，確保：

- [ ] 代碼符合 PROJECT_PLAN.md 中的設計規格
- [ ] UI 組件遵循設計規範 (字體 ≥ 18px，按鈕 ≥ 56x56px)
- [ ] 所有類型都在 TypeScript 中正確定義
- [ ] 圖片被壓縮到 < 2MB
- [ ] 沒有控制台錯誤或警告
- [ ] 代碼已使用 `npm run lint:fix` 格式化

---

## 🚨 故障排除

### 問題: Firebase 連接失敗
**解決:** 檢查 `.env.local` 中的 Firebase 配置是否正確，確保 Firestore 已在 Firebase Console 中啟用

### 問題: Gemini API 配額超限
**解決:** 檢查 Google Cloud 控制台的 API 配額，考慮增加限額或使用不同的 API Key

### 問題: 圖片上傳失敗
**解決:** 確保文件大小 < 2MB，格式為 JPEG/PNG；檢查 Firebase Storage 規則是否允許上傳

### 問題: 本地開發時圖片路徑不正確
**解決:** 確保圖片存儲在 `public/` 資料夾中，或使用 Firebase Storage 的公開 URL

---

## 📊 代碼結構檢查清單

確保項目結構符合 PROJECT_PLAN.md 中的佈局：

```
✅ src/app/layout.tsx           # Root layout 已設置
✅ src/app/page.tsx             # 首頁已實現
✅ src/app/inventory/page.tsx    # 清單頁已實現
✅ src/app/api/gemini/route.ts   # API 路由已設置
✅ src/components/Camera/        # 相機組件資料夾已創建
✅ src/components/Inventory/     # 清單組件資料夾已創建
✅ src/lib/firebase.ts           # Firebase 初始化已設置
✅ src/lib/gemini.ts             # Gemini 工具函數已實現
✅ src/types/index.ts            # 類型定義已設置
✅ src/context/FoodContext.tsx    # 全局狀態已設置
✅ src/hooks/useFoodItems.ts      # Hooks 已實現
```

---

## 🎨 設計系統速查表

### 顏色定義 (Tailwind)
```typescript
// 狀態顏色 (遵循色盲安全)
const colors = {
  red: {      // 🔴 緊急 (7 天內)
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    badge: 'bg-red-100'
  },
  yellow: {   // 🟡 注意 (7-30 天)
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
    badge: 'bg-amber-100'
  },
  green: {    // 🟢 安全 (30 天以上)
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    badge: 'bg-green-100'
  }
};
```

### 字體尺寸 (Tailwind)
```typescript
// 易讀的字體大小
const typography = {
  body: 'text-lg',           // 18px
  button: 'text-2xl',        // 24px+
  heading: 'text-4xl',       // 32px+
  label: 'text-base',        // 16px (較小的標籤)
};
```

### 間距單位 (Tailwind)
```typescript
// 使用 16px 倍數
const spacing = {
  xs: 'p-2',    // 8px (最小)
  sm: 'p-4',    // 16px
  md: 'p-6',    // 24px
  lg: 'p-8',    // 32px
  xl: 'p-12',   // 48px
};
```

### 按鈕樣式範例
```tsx
// 主要按鈕 (相機按鈕)
<button className="
  w-20 h-20           // 80x80px
  rounded-full
  bg-blue-600 hover:bg-blue-700
  text-white
  text-2xl font-bold
  shadow-lg hover:shadow-xl
  transition-all duration-200
  active:scale-95
">
  📷
</button>

// 次要按鈕
<button className="
  px-8 py-4            // 水平 32px，垂直 16px
  rounded-lg
  bg-gray-200 hover:bg-gray-300
  text-gray-800
  text-lg font-semibold
  active:bg-gray-400
">
  確認
</button>
```

---

## 🔐 環境變數範本

創建 `.env.local` 文件：

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Vercel (自動設置，無需手動)
NEXT_PUBLIC_VERCEL_ENV=development
```

**⚠️ 注意:** 絕不要將 `.env.local` 提交到 Git。已在 `.gitignore` 中配置。

---

## 📞 快速參考: 文件位置

| 功能 | 文件位置 | 用途 |
|------|--------|------|
| 首頁 UI | `src/app/page.tsx` | 相機按鈕 + 統計 |
| 清單頁面 | `src/app/inventory/page.tsx` | 食品清單展示 |
| Firebase 初始化 | `src/lib/firebase.ts` | Firebase 配置 |
| Gemini API | `src/app/api/gemini/route.ts` | 圖像識別 API 路由 |
| 全局樣式 | `src/app/globals.css` | Tailwind 自訂配置 |
| 類型定義 | `src/types/index.ts` | TypeScript 接口 |
| 全局狀態 | `src/context/FoodContext.tsx` | React Context 管理 |
| 自訂 Hooks | `src/hooks/` | 業務邏輯抽象 |

---

## 🚀 部署流程

### 部署到 Vercel

```bash
# 1. 推送代碼到 Git 倉庫
git add .
git commit -m "BestBite: [功能描述]"
git push

# 2. 登錄 Vercel 並連接倉庫
# 訪問 https://vercel.com/new

# 3. 配置環境變數
# 在 Vercel 項目設置中添加所有 .env.local 變數

# 4. 部署完成後訪問
# https://bestbite.vercel.app (或自訂域名)
```

---

## 📋 開發檢查清單 (每日使用)

- [ ] 確認 `npm run dev` 無錯誤啟動
- [ ] 檢查 `npm run lint` 無警告
- [ ] 驗證所有新組件都有 TypeScript 類型
- [ ] 確認 Firebase 連接正常
- [ ] 測試至少一個完整的用戶流程
- [ ] 檢查移動設備上的 UI 響應式設計

---

**Last Updated:** 2025-12-15
**Maintained By:** Claude Code 🤖

---

## 需要幫助？

重新連接上下文：
```
我正在開發 BestBite，一個食品庫存管理 PWA。
請參考 PROJECT_PLAN.md 和 DEVELOPMENT_GUIDE.md 中的詳細規格。
當前工作是 [具體任務]。
請確保代碼符合所有設計和架構要求。
```
