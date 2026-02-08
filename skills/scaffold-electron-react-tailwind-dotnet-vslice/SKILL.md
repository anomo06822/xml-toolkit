---
name: scaffold-electron-react-tailwind-dotnet-vslice
description: Scaffold a baseline desktop project with Electron + React (TypeScript + Tailwind CSS) + .NET 10 using Vertical Slice architecture and EF Core with either SQLite or SQL Server. Use when the user asks to create or refresh starter repository structure, initialize Git and .gitignore, and prepare macOS build/packaging commands.
---

# Scaffold Electron React Tailwind Dotnet Vslice

## Quick Start

1. Gather input values.
Project name: `TaskPilot`
Output folder: `/Users/me/workspace`
Database provider: `sqlite` or `mssql`
Git init: yes or no
2. Run `scripts/scaffold-stack.sh`.
3. Run dependency installation only when user asks for fully runnable output.
4. Verify build commands for backend, frontend, and macOS package.

## Run Scaffold Script

```bash
# Default database provider is sqlite, git init enabled
scripts/scaffold-stack.sh --name TaskPilot --output /Users/me/workspace

# SQL Server variant
scripts/scaffold-stack.sh --name TaskPilot --output /Users/me/workspace --db mssql

# Skip git init
scripts/scaffold-stack.sh --name TaskPilot --output /Users/me/workspace --no-git
```

## Workflow

### 1. Generate deterministic project layout

- Keep backend layout.
`backend/src/<Project>.Api`
`backend/src/<Project>.Application`
`backend/src/<Project>.Domain`
`backend/src/<Project>.Infrastructure`
- Keep frontend defaults.
`React + TypeScript + Tailwind CSS` on Vite.
- Keep vertical slices under `backend/src/<Project>.Api/Features/<Feature>/<UseCase>/`.

### 2. Configure EF Core provider

- Use `sqlite` for local file DB and quick startup.
- Use `mssql` for SQL Server environments.
- Keep provider-specific `UseSqlite` or `UseSqlServer` call in `Infrastructure/DependencyInjection.cs`.
- Keep connection string in `Api/appsettings.json`.

### 3. Keep repository hygiene

- Ensure `.gitignore` covers `.NET`, Node.js, Electron, build artifacts, and macOS files.
- Initialize Git at project root unless user opts out.

### 4. Build macOS package

- Build renderer: `npm run build:frontend`
- Publish backend.
`npm run build:backend:mac:arm64`
`npm run build:backend:mac:x64`
- Package desktop.
`npm run pack:mac:arm64`
`npm run pack:mac:x64`

## Validation Checklist

- Build .NET solution: `dotnet build <ProjectName>.slnx` (or `.sln`).
- Build React renderer: `npm --prefix frontend run build`
- Verify Tailwind integration by checking utility classes render in `frontend/src/App.tsx`.
- Verify API endpoints.
`GET /api/todos`
`POST /api/todos`
- Run at least one macOS package command successfully.

## References

- Read `references/architecture.md` for vertical-slice conventions.
- Read `references/macos-build.md` for packaging and signing checklist.
