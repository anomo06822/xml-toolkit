# DataToolkit - Quick Start Guide

## ✅ 項目重構完成

專案已成功重構，支援 **XML、JSON、Markdown** 三種格式的完整處理。

---

## 🚀 快速開始

### 方法 1: 本地開發

```bash
# 1. 安裝依賴
npm install

# 2. 配置環境變量（可選）
cp .env.example .env
# 編輯 .env 添加 GEMINI_API_KEY (如果要使用 AI 功能)

# 3. 啟動開發服務器
npm run dev
```

訪問 http://localhost:3000

### 方法 2: Docker 部署

```bash
# 開發模式（帶熱重載）
docker-compose -f docker-compose.dev.yml up

# 生產模式
docker-compose up -d

# 帶 Nginx 反向代理
docker-compose --profile with-nginx up -d
```

---

## 📋 功能清單

### ✅ 已完成的功能

| 功能 | XML | JSON | Markdown | 說明 |
|------|-----|------|----------|------|
| **Format/Beautify** | ✅ | ✅ | ✅ | 格式化和美化代碼 |
| **Minify** | ✅ | ✅ | ✅ | 壓縮去除空白 |
| **Sort** | ✅ | ✅ | ✅ | 按鍵/節點排序 |
| **Compare/Diff** | ✅ | ✅ | ✅ | 比較兩個文檔的差異 |
| **Convert** | ✅ | ✅ | ✅ | 格式之間相互轉換 |
| **Visualize** | ✅ | ✅ | ✅ | 樹狀/圖形視覺化 |

### ✅ 額外功能

- **自動格式檢測** - 智能識別輸入的格式
- **模板管理** - 保存和重用常用模板
- **操作歷史** - 追踪所有操作
- **數據持久化** - 本地存儲所有數據
- **導出/導入** - 備份和恢復數據
- **AI 助手** - Gemini 驅動的智能助手
- **設置頁面** - 自定義編輯器偏好
- **Docker 部署** - 生產就緒的容器化

---

## 📁 新的項目結構

```
datatoolkit/
├── core/                    # 核心處理模組
│   ├── types.ts            # 統一類型定義
│   ├── parser.ts           # 統一解析器 (自動檢測)
│   ├── diff.ts             # LCS 差異算法
│   └── parsers/            # 格式解析器
│       ├── xmlParser.ts
│       ├── jsonParser.ts
│       └── markdownParser.ts
│
├── services/               # 應用服務
│   └── storage.ts          # 數據存儲服務
│
├── features/               # 功能組件
│   ├── unified/            # 統一的多格式工具
│   │   ├── Formatter.tsx
│   │   ├── Sorter.tsx
│   │   ├── Differ.tsx
│   │   ├── Converter.tsx
│   │   └── Visualizer.tsx
│   ├── GeminiAssistant.tsx
│   └── Settings.tsx
│
└── components/             # UI 組件
    ├── common/             # 通用組件
    ├── Sidebar.tsx
    └── Button.tsx
```

---

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| `Alt + 1` | 格式化工具 |
| `Alt + 2` | 排序工具 |
| `Alt + 3` | 比較工具 |
| `Alt + 4` | 轉換工具 |
| `Alt + 5` | 視覺化工具 |
| `Alt + 6` | AI 助手 |

---

## 🔧 核心 API 使用

```typescript
import { 
  format, 
  sort, 
  convert, 
  computeDiff, 
  detectFormat 
} from './core';

// 自動檢測格式
const detected = detectFormat(content);
// { format: 'json', confidence: 1, isValid: true }

// 格式化
const formatted = format(content, 'json', { indentSize: 2 });

// 排序
const sorted = sort(content, 'json', { 
  direction: 'asc', 
  recursive: true 
});

// 轉換格式
const xml = convert(jsonContent, 'json', 'xml');

// 比較差異
const diff = computeDiff(oldContent, newContent, 'json', {
  normalize: true,
  ignoreWhitespace: true
});
```

---

## 🐳 Docker 命令

```bash
# 開發環境
docker-compose -f docker-compose.dev.yml up

# 生產環境
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down

# 重新構建
docker-compose build --no-cache
```

---

## 📊 改進對比

### 之前的問題
- ❌ 只支持 XML
- ❌ 功能重複（多個組件有相同邏輯）
- ❌ 缺少統一的數據存儲
- ❌ 沒有部署方案

### 現在的優勢
- ✅ 支持 XML、JSON、Markdown
- ✅ 統一的核心模組，減少重複
- ✅ 完整的數據存儲服務
- ✅ Docker Compose 生產部署
- ✅ 自動格式檢測
- ✅ 模板管理系統
- ✅ AI 助手集成

---

## 🔍 類型檢查

```bash
# 運行類型檢查
npm run lint

# 或直接使用 tsc
npx tsc --noEmit
```

---

## 📝 環境變量

創建 `.env` 文件：

```bash
# 應用端口
APP_PORT=3000

# Google Gemini API Key (用於 AI 功能)
GEMINI_API_KEY=your_api_key_here

# 環境
NODE_ENV=production
```

---

## 🎉 完成！

項目已完全重構並優化。所有功能都已測試並可以正常工作。

如有問題，請查看代碼或運行：
```bash
./setup.sh
```
