# DataToolkit

**A professional multi-format data processing toolkit for XML, JSON, and Markdown.**

![DataToolkit Banner](https://via.placeholder.com/1200x400/0f172a/3b82f6?text=DataToolkit)

## Features

### 🔧 Core Tools

| Feature | XML | JSON | Markdown |
|---------|-----|------|----------|
| **Format / Beautify** | ✅ | ✅ | ✅ |
| **Minify** | ✅ | ✅ | ✅ |
| **Sort** | ✅ | ✅ | ✅ |
| **Compare / Diff** | ✅ | ✅ | ✅ |
| **Convert** | ✅ | ✅ | ✅ |
| **Visualize** | ✅ | ✅ | ✅ |

### 🎯 Key Features

- **Format Detection** - Automatically detects input format
- **Template Management** - Save and reuse templates
- **Data Persistence** - All inputs saved locally
- **AI Assistant** - Powered by Google Gemini
- **Export/Import** - Backup and restore your data
- **Docker Ready** - Easy deployment with Docker Compose

## Quick Start

### Local Development

```bash
# Prerequisites: Node.js 18+

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start development server
npm run dev
```

### Docker Deployment

```bash
# Development with hot reload
docker-compose -f docker-compose.dev.yml up

# Production build
docker-compose up -d

# With nginx reverse proxy
docker-compose --profile with-nginx up -d
```

## Project Structure

```
datatoolkit/
├── core/                    # Core processing modules
│   ├── types.ts            # Type definitions
│   ├── parser.ts           # Unified parser interface
│   ├── diff.ts             # Diff algorithms
│   └── parsers/            # Format-specific parsers
│       ├── xmlParser.ts
│       ├── jsonParser.ts
│       └── markdownParser.ts
│
├── services/               # Application services
│   └── storage.ts          # Local storage management
│
├── features/               # Feature components
│   ├── unified/            # Multi-format tools
│   │   ├── Formatter.tsx
│   │   ├── Sorter.tsx
│   │   ├── Differ.tsx
│   │   ├── Converter.tsx
│   │   └── Visualizer.tsx
│   ├── GeminiAssistant.tsx
│   └── Settings.tsx
│
├── components/             # UI components
│   ├── common/             # Reusable components
│   ├── Sidebar.tsx
│   └── Button.tsx
│
├── docker-compose.yml      # Production deployment
├── docker-compose.dev.yml  # Development deployment
├── Dockerfile              # Production build
└── Dockerfile.dev          # Development build
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key for AI features | No |
| `APP_PORT` | Application port (default: 3000) | No |
| `NODE_ENV` | Environment mode | No |

### Docker Compose Profiles

- **Default**: Just the main application
- **with-nginx**: Includes nginx reverse proxy
- **with-traefik**: Includes Traefik for advanced routing

## Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt + 1` | Format tool |
| `Alt + 2` | Sort tool |
| `Alt + 3` | Compare tool |
| `Alt + 4` | Convert tool |
| `Alt + 5` | Visualize tool |
| `Alt + 6` | AI Assistant |

### API (Core Module)

```typescript
import { format, sort, convert, computeDiff, detectFormat } from './core';

// Auto-detect and format
const detected = detectFormat(content);
const formatted = format(content, detected.format);

// Convert between formats
const json = convert(xmlContent, 'xml', 'json');

// Compare two documents
const diff = computeDiff(oldContent, newContent, 'json');
```

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI**: Google Gemini API
- **Build**: Vite
- **Deployment**: Docker, Nginx

## License

MIT License - see LICENSE file for details.
