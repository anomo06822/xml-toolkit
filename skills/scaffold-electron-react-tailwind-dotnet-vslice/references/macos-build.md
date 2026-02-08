# macOS Build Reference

## Build Flow

From project root:

```bash
npm run build:frontend
npm run build:backend:mac:arm64
npm run pack:mac:arm64
```

For Intel Macs:

```bash
npm run build:backend:mac:x64
npm run pack:mac:x64
```

## Packaging Notes

- `electron-builder.yml` controls package output in `release/`
- `extraResources` includes published .NET backend binary in app resources
- Electron main process starts backend binary on packaged runtime

## Code Signing Checklist

Use signing only when user requests distributable builds:

1. Set Apple Developer signing identity in environment.
2. Configure notarization credentials (app-specific password or API key).
3. Run `electron-builder --mac --arm64` or `--x64` with signing variables.
4. Verify notarization ticket and Gatekeeper launch.

## Runtime Expectations

- React renderer loads from `frontend/dist`
- Backend API runs at `http://127.0.0.1:5000`
- Renderer calls `http://127.0.0.1:5000/api/*`
