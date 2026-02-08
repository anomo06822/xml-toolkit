# Desktop Signing and Notarization

This project supports desktop releases with optional signing:

- macOS code signing + notarization (`.dmg`)
- Windows code signing (`.exe`)

If signing secrets are not configured, the release workflow still publishes unsigned installers.

## Optional GitHub Secrets (for signed builds)

### Shared (Electron code signing)

- `CSC_LINK`: Base64 or URL to your signing certificate bundle (`.p12`)
- `CSC_KEY_PASSWORD`: Password for the certificate

### macOS notarization

- `APPLE_ID`: Apple Developer account email
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password for notarization
- `APPLE_TEAM_ID`: Apple Developer Team ID

## Workflows

- CI packaging (unsigned): `.github/workflows/desktop-package.yml`
- Signed release (tag/manual): `.github/workflows/desktop-release-signed.yml`

Versioning in release workflow:

- `refs/tags/vX.Y.Z` -> uses `X.Y.Z` as app version
- manual dispatch -> uses `0.0.<run_number>`

## Release Trigger

Push a tag like:

```bash
git tag v2.1.0
git push origin v2.1.0
```

The release workflow will:

1. Build renderer
2. Publish backend sidecar (`.NET 10`)
3. Build installers via `electron-builder`
4. If signing secrets exist: sign installers (+ notarize/staple macOS `.dmg`)
5. Upload artifacts to GitHub Release

The release workflow also uploads `latest*.yml` metadata so Electron auto-update can detect newer versions.

## Local Notarization Script

For manual mac notarization:

```bash
bash ./scripts/release/notarize-macos.sh
```

Environment variables required:

- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`
