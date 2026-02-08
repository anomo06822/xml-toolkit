# DataToolkit

Multi-format data toolkit for XML, JSON, and Markdown, now with Electron desktop packaging (`.dmg` / `.exe`) and optional `.NET 10` backend proxy.

## Features

- Format / Minify / Sort / Diff / Convert / Visualize
- AI Assistant and AI Diff Summary (Gemini)
- Desktop app packaging with Electron
- Global wakeup shortcut configurable in Settings (Electron)
- macOS menu bar status entry (Electron)
- Optional local backend (`.NET 10`) for API key isolation
- Docker deployment for web mode

## Prerequisites

- Node.js 20+
- npm 10+
- `.NET 10 SDK` (only needed for backend mode)

## Quick Start (Web)

```bash
npm install
cp .env.example .env
# Optional for web/direct Gemini mode:
# GEMINI_API_KEY=your_key
npm run dev
```

## Quick Start (Electron Desktop)

```bash
# Install JS dependencies first
npm install

# Start Electron + Vite renderer
npm run electron:dev
```

By default `electron:dev` does not auto-start backend.  
If you want Electron to auto-run `.NET 10` backend:

```bash
npm run electron:dev:backend
```

## Desktop Packaging

### 1) Build renderer + package desktop app

```bash
# Generate unpacked app folder
npm run desktop:pack

# Generate installers/artifacts by current host platform
npm run desktop:dist
```

### 2) Platform-specific targets

```bash
# macOS DMG
npm run desktop:dist:mac

# Windows EXE (NSIS)
npm run desktop:dist:win
```

Artifacts output to `release/`.

## CI Packaging (GitHub Actions)

Workflows:

- `.github/workflows/desktop-package.yml`:
  builds unsigned artifacts on macOS + Windows for PR/push/manual trigger.
- `.github/workflows/desktop-release-signed.yml`:
  publishes release assets on tag (`v*`) or manual trigger.  
  If signing secrets exist it signs installers (and notarizes macOS); otherwise it auto-falls back to unsigned artifacts.

## Signing and Notarization

Required GitHub secrets:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `APPLE_ID` (macOS notarization only)
- `APPLE_APP_SPECIFIC_PASSWORD` (macOS notarization only)
- `APPLE_TEAM_ID` (macOS notarization only)

If you do not provide these secrets, release workflow still runs and uploads unsigned `.dmg/.exe`.

Detailed setup:

- `docs/desktop-signing.md`

## Optional Backend (`.NET 10`)

Backend project path:

- `backend/DataToolkit.Api/DataToolkit.Api.csproj`

Endpoints:

- `GET /health`
- `POST /api/ai/generate`

Run backend directly:

```bash
npm run backend:run
```

Backend reads:

- `GEMINI_API_KEY` from environment

### Publish backend for Electron bundle

```bash
# macOS binary output -> backend/publish/mac
npm run backend:publish:mac

# Windows binary output -> backend/publish/win
npm run backend:publish:win
```

`electron-builder` includes `backend/publish/**` as extra resources.

## AI Routing Strategy

The app now uses this order:

1. If running in Electron, call local backend through IPC (`window.electronAPI.backend.generate`).
2. If backend is unavailable and a frontend token exists, fallback to direct `@google/genai`.
3. If neither is available, show configuration error.

This keeps web mode compatible while allowing desktop deployments to hide upstream API keys in backend.

## Scripts

- `npm run dev` - Vite web dev server
- `npm run electron:dev` - Electron + Vite
- `npm run electron:dev:backend` - Electron + Vite + auto backend
- `npm run desktop:pack` - Desktop unpacked output
- `npm run desktop:dist` - Desktop installers/artifacts
- `npm run desktop:dist:mac` - DMG build
- `npm run desktop:dist:win` - EXE (NSIS) build
- `npm run desktop:dist:mac:ci` - CI DMG build without publish
- `npm run desktop:dist:win:ci` - CI EXE build without publish
- `npm run backend:run` - Run `.NET 10` backend
- `npm run lint` - Type check
- `npm run test:run` - Run tests

## Project Structure

```text
datatoolkit/
├── electron/
│   ├── main.cjs
│   └── preload.cjs
├── backend/
│   └── DataToolkit.Api/
│       ├── DataToolkit.Api.csproj
│       └── Program.cs
├── services/
│   ├── storage.ts
│   └── aiClient.ts
├── features/
├── core/
├── electron-builder.yml
└── package.json
```

## Notes

- Web/Docker mode and Electron mode can coexist.
- For macOS notarization, workflow uses `scripts/release/notarize-macos.sh`.

## License

MIT
