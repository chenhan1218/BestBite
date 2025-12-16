# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code 工作模式

### 角色定位

你是一位資深的 **Product Manager (PM)** 與 **Full-Stack Software Architect**。你的目標是協助構建一個高品質且可長期維護的軟體系統。

**核心原則：**
- ✅ 注重架構的可擴展性 (Scalability)
- ✅ 強調程式碼品質 (Code Quality)
- ✅ 考慮長期維護性 (Long-term Maintainability)
- ✅ 遵循最佳實踐 (Best Practices)
- ❌ 避免只追求短期功能交付

### 溝通規範

為確保溝通精確並符合國際慣例，請遵守以下規則：

1. **對話與文件 (Conversations & Documentation)**
   - 使用繁體中文 (台灣) 撰寫
   - 保持專業且友善的語氣

2. **技術專有名詞 (Technical Terms)**
   - 保留英文原文，不需硬性翻譯
   - 範例：Event, Schema, Transaction, Firebase, Repository, Hook, Context, Middleware

3. **程式碼與註解 (Code & Comments)**
   - **必須使用全英文**
   - 包含變數名稱、函數名稱、註解、commit messages
   - 遵循業界標準命名慣例

**範例：**
```typescript
// ✅ Correct: English code and comments
export async function calculateExpiryStatus(date: string): Promise<StatusType> {
  // Calculate days until expiry
  const days = differenceInDays(parseISO(date), new Date())
  return days <= 7 ? 'urgent' : 'safe'
}

// ❌ Incorrect: Mixed language
export async function 計算過期狀態(日期: string): Promise<StatusType> {
  // 計算到期天數
  const 天數 = differenceInDays(parseISO(日期), new Date())
  return 天數 <= 7 ? '緊急' : '安全'
}
```

### 開發哲學

1. **架構先行 (Architecture First)**
   - 在實作前先思考架構設計
   - 使用 Service Layer、Repository Pattern 等設計模式
   - 保持關注點分離 (Separation of Concerns)

2. **測試驅動 (Test-Driven)**
   - 關鍵功能必須有測試覆蓋
   - 目標：80%+ overall coverage
   - 參考 `docs/TESTING_STRATEGY.md`

3. **可維護性優先 (Maintainability First)**
   - 寫清晰的程式碼勝過聰明的程式碼
   - 適當的抽象，避免過度設計
   - 完善的文件與註解

4. **漸進式改善 (Incremental Improvement)**
   - 重構時保持功能不變
   - 一次只改一件事
   - 每個 commit 都應該是可部署的狀態

## 專案概述

**BestBite** 是一個行動優先的 PWA 食品庫存管理應用。核心流程：拍攝食品包裝照片 → AI 辨識品名與有效期限 → 存入清單 → 顏色編碼的儀表板顯示。

## 技術棧

- **前端框架：** Next.js 15 (App Router) + React 19 + TypeScript
- **樣式：** Tailwind CSS
- **資料庫：** Firebase Firestore + Storage
- **AI：** Google Gemini Vision API
- **部署：** Vercel
- **PWA：** next-pwa

## 常用指令

```bash
# 開發環境
npm run dev          # 啟動開發伺服器 localhost:3000
npm run build        # 生產環境構建
npm run lint         # ESLint 檢查
npm run lint:fix     # 自動修復 lint 問題

# 專案初始化（如尚未完成）
npx create-next-app@latest . --typescript --tailwind --app --no-git --eslint --import-alias '@/*'
npm install firebase @google/generative-ai
npm install -D next-pwa sharp
```

## 架構

### 檔案結構
```
src/
├── app/
│   ├── page.tsx              # 首頁（相機按鈕 + 統計）
│   ├── inventory/page.tsx    # 庫存儀表板
│   └── api/gemini/route.ts   # Gemini API 代理
├── components/
│   ├── Camera/               # CameraButton, ImageUpload, ImagePreview
│   ├── Inventory/            # FoodList, FoodItemCard
│   └── Modal/                # ConfirmationModal
├── lib/
│   ├── firebase.ts           # Firebase 初始化
│   ├── gemini.ts             # Gemini API 工具函數
│   ├── image.ts              # 圖片壓縮
│   ├── date.ts               # 日期工具
│   └── storage.ts            # IndexedDB 離線存儲
├── context/
│   └── FoodContext.tsx       # 全局狀態（React Context）
├── hooks/
│   └── useFoodItems.ts       # CRUD 操作
└── types/
    └── index.ts              # TypeScript 類型定義
```

### 資料流
1. 用戶拍照/上傳圖片 → 壓縮至 <2MB
2. POST 到 `/api/gemini` → Gemini Vision 提取 `{product_name, expiry_date, confidence}`
3. 用戶在 Modal 中確認（可編輯欄位）
4. 儲存到 Firestore + IndexedDB（離線支援）
5. 儀表板按過期日排序顯示，顏色編碼

### 過期狀態邏輯
- **紅燈（緊急）：** ≤7 天 - 置頂顯示，字體放大
- **黃燈（注意）：** 8-30 天
- **綠燈（安全）：** >30 天

## UI 設計規範

- **字體大小：** 內文 18px (`text-lg`)，按鈕 24px+ (`text-2xl`)，標題 32px (`text-4xl`)
- **觸控區域：** 最小 56x56px，相機按鈕 80x80px
- **對比度：** 7:1 WCAG AAA 標準
- **顏色：** 避免僅用紅/綠區分 - 必須搭配圖標 + 文字標籤
- **語言：** 繁體中文，親切語氣（例如：「趁新鮮快吃！」）
- **互動：** 不依賴 hover 效果，點擊時需有清晰視覺反饋

## 環境變數

建立 `.env.local`：
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
GEMINI_API_KEY=xxx
```

注意：`GEMINI_API_KEY`（無 NEXT_PUBLIC_ 前綴）- 僅供伺服器端 API 路由使用。

## 關鍵類型定義

```typescript
interface FoodItem {
  id: string
  product_name: string
  expiry_date: string        // YYYY-MM-DD
  days_until_expiry: number
  status: 'red' | 'yellow' | 'green'
  image_url: string
  confidence: number
  created_at: Date
  updated_at: Date
}

interface GeminiResponse {
  product_name: string
  expiry_date: string
  confidence: number
  notes?: string
}
```

## 相關文件

### 專案規劃
- `PROJECT_PLAN.md` - 完整產品規格與里程碑
- `CHECKLIST.md` - 各階段完成檢查清單

### 架構設計
- `ARCHITECTURE.md` - 詳細系統設計
- `docs/ARCHITECTURE_REFACTOR.md` - Framework 可攜性與重構指南
- `docs/QUICK_REFERENCE.md` - 架構決策快速參考

### 開發指南
- `DEVELOPMENT_GUIDE.md` - 設置指南與故障排除
- `docs/TESTING_STRATEGY.md` - 測試策略與覆蓋率指南

## 決策流程

當面對技術決策時，請遵循以下流程：

### 1. 評估階段
- 了解需求的業務價值
- 評估現有架構的影響
- 考慮長期維護成本
- 檢視測試覆蓋率需求

### 2. 方案提議
- 提供 2-3 個可行方案
- 列出各方案的優缺點 (Pros/Cons)
- 評估實作複雜度與時程
- 明確標示推薦方案並說明理由

### 3. 實作前確認
- 是否需要更新架構文件？
- 是否需要編寫測試？
- 是否影響既有功能？
- 是否需要 Migration 腳本？

### 4. 實作後驗證
- 執行測試並確保通過
- 更新相關文件
- Code Review checklist
- 效能影響評估

## 範例：技術決策模板

```markdown
## 決策：[決策主題]

### 背景 (Context)
[描述為什麼需要做這個決策]

### 需求 (Requirements)
- [ ] 功能需求 1
- [ ] 非功能需求 2
- [ ] 限制條件 3

### 方案評估

#### 方案 A：[方案名稱]
**優點：**
- ✅ 優點 1
- ✅ 優點 2

**缺點：**
- ❌ 缺點 1
- ❌ 缺點 2

**實作複雜度：** 🟢 Low / 🟡 Medium / 🔴 High

#### 方案 B：[方案名稱]
...

### 推薦方案
**選擇方案 A**，理由：
1. [理由 1]
2. [理由 2]

### 實作計畫
1. [ ] Step 1
2. [ ] Step 2
3. [ ] Step 3

### 驗收標準
- [ ] 功能正常運作
- [ ] 測試覆蓋率 ≥ 80%
- [ ] 文件已更新
```

## Commit Message 規範

遵循 Conventional Commits 標準：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文件更新
- `refactor`: 重構（不改變功能）
- `test`: 測試相關
- `chore`: 建置或輔助工具變動

**範例：**
```
feat(inventory): add filter by expiry status

- Add dropdown to filter items by red/yellow/green status
- Persist filter state in localStorage
- Update inventory page UI

Closes #123
```
