# 🍴 BestBite - 食品庫存管理 PWA

### 📱 項目簡介

**BestBite** 是一個行動優先的 PWA (Progressive Web App) 應用，幫助用戶輕鬆管理食品庫存並追蹤有效期限。

**核心流程：** 📷 拍照 → 🤖 AI 識別 → 📋 存入清單 → ⏰ 有效期提醒

用戶只需拍攝食品包裝照片，應用會自動識別產品名稱和有效期限，並將其按照過期時間用顏色編碼：
- 🔴 **紅燈（緊急）**：≤7 天過期 - 置頂顯示、字體放大
- 🟡 **黃燈（注意）**：8-30 天過期
- 🟢 **綠燈（安全）**：>30 天過期

---

### ✨ 核心功能

#### 1. 相機輸入
- 首頁單一巨大按鈕，點擊即可打開相機或上傳照片
- 支援 iOS 和 Android 原生相機功能
- 自動壓縮圖片至 <2MB

#### 2. AI 圖像識別
- 整合 Google Gemini Vision API
- 自動識別：產品名稱、有效期限、識別信心度
- 用戶可編輯確認結果後保存

#### 3. 庫存儀表板
- 按有效期自動排序的食品清單
- 三層狀態視覺化（紅/黃/綠）
- 支援長按或滑動刪除、標記為已食用

#### 4. PWA 支援
- 離線可用（使用 IndexedDB 本地存儲）
- 可安裝為原生應用
- Service Worker 支援

---

### 📈 開發進度

**整體完成度：75% 🎯**

詳細進度請查看以下文件：

- **[PROGRESS.md](./PROGRESS.md)** - 📊 實時進度概覽（30秒快速掃描）
  - 各階段完成度視覺化進度條
  - 已完成項目清單（30+ 個）
  - 待完成項目清單（15+ 個）
  - 快速命令參考

- **[CHECKLIST.md](./CHECKLIST.md)** - ✅ 詳細任務檢查清單
  - 8 個開發階段，每階段任務明細
  - [x] 完成標記和 [ ] 待完成標記
  - Phase 1 核心功能完成標誌

#### 快速進度概覽

| 指標 | 狀態 |
|------|------|
| **整體完成度** | 75% 🎯 |
| **後端基礎設施** | 100% ✅ |
| **前端組件** | 60% 🔄 |
| **用戶功能集成** | 50% 🔄 |
| **測試覆蓋率** | 87/87 通過 ✅ |
| **構建狀態** | 成功 ✅ |

#### 下一步優先級

1. **實現相機組件**（2-3天）- CameraButton, ImageUpload, ImagePreview
2. **實現 Gemini API 路由**（2-3天）- `/api/gemini` 端點
3. **實現確認對話框**（2-3天）- ConfirmationModal 組件
4. **實現清單 UI**（3-4天）- FoodList, FoodItemCard 組件

詳見 [PROGRESS.md](./PROGRESS.md) 中的「下一步優先級排序」。

---

### 🛠️ 技術棧

| 層級 | 技術 | 用途 |
|------|------|------|
| **前端框架** | Next.js 15 (App Router) | 伺服器組件 + SSR |
| **UI 框架** | React 19 | 最新穩定版 |
| **樣式** | Tailwind CSS | 快速開發、易於自訂 |
| **狀態管理** | React Context API | 簡單項目足夠、支援離線 |
| **資料庫** | Firebase Firestore | 無伺服器、實時同步 |
| **雲存儲** | Firebase Storage | 圖片存儲 |
| **AI 集成** | Google Gemini API | Vision 圖像識別 |
| **PWA** | next-pwa | 離線支援、app-like 體驗 |
| **圖像處理** | Sharp + Canvas API | 圖片壓縮、預覽 |
| **部署** | Vercel | Next.js 官方推薦 |

---

### 🚀 快速開始

#### 1. 環境需求

- Node.js 18.17+ 或 19+
- npm 或 yarn 包管理器
- Git

#### 2. 克隆並安裝

```bash
# 克隆倉庫
git clone <repository-url>
cd BestBite

# 安裝依賴
npm install

# 複製環境變數範本
cp .env.local.example .env.local
```

#### 3. 配置環境變數

編輯 `.env.local` 文件，填入以下配置：

```env
# Firebase 配置（從 Firebase Console 獲取）
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API Key（從 Google AI Studio 獲取）
GEMINI_API_KEY=your_gemini_api_key
```

**取得配置方式：**

- **Firebase 配置**：[Firebase Console](https://console.firebase.google.com) → 項目設置 → 複製配置
- **Gemini API Key**：[Google AI Studio](https://ai.google.dev) → 建立 API Key

#### 4. 啟動開發伺服器

```bash
npm run dev
```

訪問 [http://localhost:3000](http://localhost:3000) 查看應用。

---

### 📁 項目結構

```
BestBite/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root Layout
│   │   ├── page.tsx                # 首頁（相機按鈕 + 統計）
│   │   ├── inventory/
│   │   │   └── page.tsx            # 庫存儀表板
│   │   ├── api/
│   │   │   └── gemini/
│   │   │       └── route.ts        # Gemini API 代理
│   │   └── globals.css             # 全域 Tailwind 樣式
│   │
│   ├── components/
│   │   ├── Camera/                 # 相機相關組件
│   │   │   ├── CameraButton.tsx
│   │   │   ├── ImageUpload.tsx
│   │   │   └── ImagePreview.tsx
│   │   ├── Inventory/              # 庫存相關組件
│   │   │   ├── FoodList.tsx
│   │   │   ├── FoodItemCard.tsx
│   │   │   └── FilterTabs.tsx
│   │   ├── Modal/                  # 對話框組件
│   │   │   └── ConfirmationModal.tsx
│   │   └── Common/                 # 通用組件
│   │       ├── Header.tsx
│   │       └── Loading.tsx
│   │
│   ├── lib/
│   │   ├── firebase.ts             # Firebase 初始化
│   │   ├── gemini.ts               # Gemini API 工具
│   │   ├── image.ts                # 圖片壓縮工具
│   │   ├── date.ts                 # 日期計算工具
│   │   └── storage.ts              # IndexedDB 工具
│   │
│   ├── context/
│   │   └── FoodContext.tsx         # 全局狀態管理
│   │
│   ├── hooks/
│   │   ├── useFoodItems.ts         # 食品 CRUD Hooks
│   │   └── useCamera.ts            # 相機功能 Hooks
│   │
│   └── types/
│       └── index.ts                # TypeScript 類型定義
│
├── public/
│   ├── manifest.json               # PWA Manifest
│   ├── icons/                      # PWA 圖標
│   └── sw.js                       # Service Worker
│
├── .env.local                      # 環境變數（Git 忽略）
├── next.config.js                  # Next.js 配置
├── tailwind.config.ts              # Tailwind 配置
├── tsconfig.json                   # TypeScript 配置
├── package.json
│
├── PROJECT_PLAN.md                 # 完整項目規劃
├── ARCHITECTURE.md                 # 詳細系統架構
├── DEVELOPMENT_GUIDE.md            # 開發工作指南
├── CLAUDE.md                       # Claude Code 工作指南
└── README.md                       # 本文件
```

---

### 🔄 核心概念

#### 數據流

```
用戶拍照
  ↓
圖片上傳到 /api/gemini
  ↓
Gemini AI 識別品名 & 有效期
  ↓
用戶確認修改（確認對話框）
  ↓
保存到 Firestore + IndexedDB
  ↓
儀表板自動更新
```

#### 狀態管理

應用使用 **React Context API** 管理全局食品清單狀態：

```typescript
interface FoodContextType {
  foodItems: FoodItem[]
  loading: boolean
  error: string | null

  addFoodItem(data: FoodItemInput): Promise<void>
  updateFoodItem(id: string, data: Partial<FoodItem>): Promise<void>
  deleteFoodItem(id: string): Promise<void>
  getFoodItems(userId?: string): Promise<void>
}
```

#### 數據模型

```typescript
interface FoodItem {
  id: string
  product_name: string           // "義美小泡芙"
  expiry_date: string            // "YYYY-MM-DD"
  days_until_expiry: number
  status: 'red' | 'yellow' | 'green'
  image_url: string
  confidence: number             // 0-100
  created_at: Date
  updated_at: Date
}
```

---

### 💻 開發工作流程

#### 1. 創建新功能

```bash
# 1. 創建新分支
git checkout -b feature/your-feature-name

# 2. 編寫代碼（遵循 CLAUDE.md 中的規範）

# 3. 執行 lint
npm run lint:fix

# 4. 本地測試
npm run dev

# 5. 提交並推送
git add .
git commit -m "feat: Add new feature description"
git push -u origin feature/your-feature-name
```

#### 2. 代碼規範

- **TypeScript**：所有代碼必須使用 TypeScript，充分利用類型檢查
- **變數命名**：使用英文駝峰式命名（camelCase）
- **組件命名**：使用帕斯卡命名法（PascalCase）
- **註解**：使用英文撰寫，邏輯不明顯時添加註解
- **格式化**：執行 `npm run lint:fix` 自動修復

#### 3. 設計規範

詳見 `DEVELOPMENT_GUIDE.md` 中的「設計系統速查表」：

- **字體大小**：內文 18px (`text-lg`)，按鈕 24px+ (`text-2xl`)，標題 32px+ (`text-4xl`)
- **觸控區域**：最小 56x56px，主要按鈕 80x80px
- **顏色對比度**：7:1 WCAG AAA 標準
- **交互**：無 Hover 依賴，充分支援觸摸設備

---

### 📚 常用命令

```bash
# 開發
npm run dev                # 啟動開發伺服器
npm run build              # 生產環境構建
npm start                  # 啟動生產伺服器

# 代碼檢查
npm run lint               # ESLint 檢查
npm run lint:fix           # 自動修復 ESLint 問題

# 清理
rm -rf .next node_modules  # 清除緩存
npm install                # 重新安裝依賴
```

---

### 🚀 部署

#### 部署到 Vercel（推薦）

1. **推送代碼到 GitHub**：

```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. **連接 Vercel**：

訪問 [vercel.com/new](https://vercel.com/new)，選擇 GitHub 倉庫並連接。

3. **配置環境變數**：

在 Vercel 項目設置中添加所有 `.env.local` 變數。

4. **自動部署**：

每次推送到 main 分支時，Vercel 會自動部署。

---

### 🧪 測試

```bash
# 執行單元測試
npm run test

# 執行端到端測試
npm run e2e
```

詳見 `ARCHITECTURE.md` 中的「測試策略」部分。

---

### 📖 文檔索引

| 文檔 | 內容 | 何時閱讀 |
|------|------|---------|
| [PROJECT_PLAN.md](./PROJECT_PLAN.md) | 完整項目規劃、功能列表、技術棧、UI 設計原則、實現階段 | **新成員**必讀，了解整體項目 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 系統架構、數據流、組件設計、API 路由、安全考慮、性能優化 | **開發新功能**時參考設計 |
| [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) | 快速開始、常用命令、開發檢查清單、設計系統速查表、環境變數配置 | **日常開發**時快速查閱 |
| [CLAUDE.md](./CLAUDE.md) | Claude Code 工作模式、角色職責、設計原則、文件結構、類型定義 | **AI 輔助開發**時參考工作指南 |

---

### ⚠️ 常見問題

**Q: 沒有環境變數，應用無法運行？**

A: 確保已建立 `.env.local` 文件並正確填入 Firebase 和 Gemini API 配置。參考 `DEVELOPMENT_GUIDE.md` 中的「環境變數範本」。

**Q: Firebase 連接失敗？**

A: 檢查 Firebase 配置是否正確，確保在 Firebase Console 中啟用了 Firestore 和 Storage。

**Q: Gemini API 配額超限？**

A: 檢查 Google Cloud 控制台的 API 配額，考慮增加限額或使用其他 API Key。

**Q: 圖片上傳失敗？**

A: 確保文件大小 <2MB，格式為 JPEG/PNG；檢查 Firebase Storage 規則是否允許上傳。

更多問題，詳見 `DEVELOPMENT_GUIDE.md` 中的「故障排除」部分。

---

### 📞 聯繫方式

如有問題或建議，請提交 [GitHub Issue](https://github.com/chenhan1218/BestBite/issues)。

---

### 📄 授權

本項目採用 MIT License。詳見 [LICENSE](./LICENSE) 文件。

---

### 🎯 開發目標

✅ 用戶能通過單一按鈕上傳食品照片
✅ AI 自動識別產品名稱和有效期限
✅ 清單按過期日期自動分類（紅/黃/綠）
✅ UI 簡潔易用（清晰字體、高對比、易點擊按鈕）
✅ 支援離線使用（本地數據持久化）
✅ 部署到 Vercel，可通過公開 URL 訪問
✅ 在 iOS 和 Android 上都能正常運行

---

**Last Updated:** 2025-12-17
**Maintained By:** Claude Code 🤖
