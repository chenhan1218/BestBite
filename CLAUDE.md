# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- `PROJECT_PLAN.md` - 完整產品規格與里程碑
- `ARCHITECTURE.md` - 詳細系統設計
- `DEVELOPMENT_GUIDE.md` - 設置指南與故障排除
- `CHECKLIST.md` - 各階段完成檢查清單
