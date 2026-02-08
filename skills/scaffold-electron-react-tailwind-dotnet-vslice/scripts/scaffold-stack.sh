#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scaffold-stack.sh --name <ProjectName> [--output <Directory>] [--db <sqlite|mssql>] [--no-git] [--install]

Options:
  --name <ProjectName>   Required. Project name used for solution and namespaces.
  --output <Directory>   Optional. Parent directory for generated project (default: current directory).
  --db <provider>        Optional. Database provider: sqlite or mssql (default: sqlite).
  --no-git               Optional. Skip git initialization.
  --install              Optional. Run npm/dotnet dependency restore after scaffolding.
  -h, --help             Show this help message.
EOF
}

die() {
  echo "Error: $*" >&2
  exit 1
}

require_cmd() {
  local cmd="$1"
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
}

run() {
  echo ">> $*"
  "$@"
}

to_pascal_case() {
  local input="$1"
  local normalized
  normalized="$(echo "$input" | tr -cs '[:alnum:]' ' ' | xargs)"

  if [[ -z "$normalized" ]]; then
    echo ""
    return
  fi

  awk '{
    for (i = 1; i <= NF; i++) {
      token = $i
      first = toupper(substr(token, 1, 1))
      rest = tolower(substr(token, 2))
      printf "%s%s", first, rest
    }
    printf "\n"
  }' <<<"$normalized"
}

to_slug() {
  local input="$1"
  local slug
  slug="$(echo "$input" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  echo "$slug"
}

PROJECT_INPUT=""
OUTPUT_DIR="$(pwd)"
DB_PROVIDER="sqlite"
INIT_GIT="true"
INSTALL_DEPS="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      [[ $# -ge 2 ]] || die "Missing value for --name"
      PROJECT_INPUT="$2"
      shift 2
      ;;
    --output)
      [[ $# -ge 2 ]] || die "Missing value for --output"
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --db)
      [[ $# -ge 2 ]] || die "Missing value for --db"
      DB_PROVIDER="$(echo "$2" | tr '[:upper:]' '[:lower:]')"
      shift 2
      ;;
    --no-git)
      INIT_GIT="false"
      shift
      ;;
    --install)
      INSTALL_DEPS="true"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

[[ -n "$PROJECT_INPUT" ]] || die "--name is required"

case "$DB_PROVIDER" in
  sqlite|mssql) ;;
  *) die "--db must be sqlite or mssql" ;;
esac

PROJECT_NAME="$(to_pascal_case "$PROJECT_INPUT")"
PROJECT_SLUG="$(to_slug "$PROJECT_INPUT")"

[[ -n "$PROJECT_NAME" ]] || die "Unable to derive project name from input: $PROJECT_INPUT"
[[ -n "$PROJECT_SLUG" ]] || die "Unable to derive project folder name from input: $PROJECT_INPUT"

if [[ "$PROJECT_NAME" =~ ^[0-9] ]]; then
  PROJECT_NAME="App${PROJECT_NAME}"
fi

mkdir -p "$OUTPUT_DIR"
ROOT_DIR="$(cd "$OUTPUT_DIR" && pwd)/$PROJECT_SLUG"

if [[ -e "$ROOT_DIR" ]]; then
  die "Target directory already exists: $ROOT_DIR"
fi

require_cmd dotnet
if [[ "$INIT_GIT" == "true" ]]; then
  require_cmd git
fi
if [[ "$INSTALL_DEPS" == "true" ]]; then
  require_cmd npm
fi

API_PROJECT="${PROJECT_NAME}.Api"
APPLICATION_PROJECT="${PROJECT_NAME}.Application"
DOMAIN_PROJECT="${PROJECT_NAME}.Domain"
INFRASTRUCTURE_PROJECT="${PROJECT_NAME}.Infrastructure"

BACKEND_SRC_DIR="$ROOT_DIR/backend/src"
API_DIR="$BACKEND_SRC_DIR/$API_PROJECT"
APPLICATION_DIR="$BACKEND_SRC_DIR/$APPLICATION_PROJECT"
DOMAIN_DIR="$BACKEND_SRC_DIR/$DOMAIN_PROJECT"
INFRASTRUCTURE_DIR="$BACKEND_SRC_DIR/$INFRASTRUCTURE_PROJECT"

SOLUTION_FILE="$ROOT_DIR/$PROJECT_NAME.sln"
API_CSPROJ="$API_DIR/$API_PROJECT.csproj"
APPLICATION_CSPROJ="$APPLICATION_DIR/$APPLICATION_PROJECT.csproj"
DOMAIN_CSPROJ="$DOMAIN_DIR/$DOMAIN_PROJECT.csproj"
INFRASTRUCTURE_CSPROJ="$INFRASTRUCTURE_DIR/$INFRASTRUCTURE_PROJECT.csproj"

EF_PROVIDER_PACKAGE="Microsoft.EntityFrameworkCore.Sqlite"
EF_PROVIDER_LINE="options.UseSqlite(connectionString);"
CONNECTION_STRING='Data Source=app.db'
DB_DISPLAY_NAME="SQLite"

if [[ "$DB_PROVIDER" == "mssql" ]]; then
  EF_PROVIDER_PACKAGE="Microsoft.EntityFrameworkCore.SqlServer"
  EF_PROVIDER_LINE="options.UseSqlServer(connectionString);"
  CONNECTION_STRING="Server=localhost,1433;Database=${PROJECT_NAME}Db;User Id=sa;Password=YourStrong!Passw0rd;TrustServerCertificate=True"
  DB_DISPLAY_NAME="SQL Server"
fi

mkdir -p "$BACKEND_SRC_DIR" "$ROOT_DIR/frontend/src" "$ROOT_DIR/desktop"

run dotnet new sln -n "$PROJECT_NAME" -o "$ROOT_DIR"
run dotnet new webapi -n "$API_PROJECT" -f net10.0 --no-openapi --no-restore -o "$API_DIR"
run dotnet new classlib -n "$APPLICATION_PROJECT" -f net10.0 --no-restore -o "$APPLICATION_DIR"
run dotnet new classlib -n "$DOMAIN_PROJECT" -f net10.0 --no-restore -o "$DOMAIN_DIR"
run dotnet new classlib -n "$INFRASTRUCTURE_PROJECT" -f net10.0 --no-restore -o "$INFRASTRUCTURE_DIR"

if [[ -f "$ROOT_DIR/$PROJECT_NAME.sln" ]]; then
  SOLUTION_FILE="$ROOT_DIR/$PROJECT_NAME.sln"
elif [[ -f "$ROOT_DIR/$PROJECT_NAME.slnx" ]]; then
  SOLUTION_FILE="$ROOT_DIR/$PROJECT_NAME.slnx"
else
  die "Unable to locate generated solution file (.sln or .slnx)."
fi

SOLUTION_FILENAME="$(basename "$SOLUTION_FILE")"

run dotnet sln "$SOLUTION_FILE" add "$API_CSPROJ" "$APPLICATION_CSPROJ" "$DOMAIN_CSPROJ" "$INFRASTRUCTURE_CSPROJ"
run dotnet add "$APPLICATION_CSPROJ" reference "$DOMAIN_CSPROJ"
run dotnet add "$INFRASTRUCTURE_CSPROJ" reference "$APPLICATION_CSPROJ" "$DOMAIN_CSPROJ"
run dotnet add "$API_CSPROJ" reference "$APPLICATION_CSPROJ" "$INFRASTRUCTURE_CSPROJ"

run dotnet add "$INFRASTRUCTURE_CSPROJ" package Microsoft.EntityFrameworkCore --version 10.0.0 --no-restore
run dotnet add "$INFRASTRUCTURE_CSPROJ" package Microsoft.EntityFrameworkCore.Design --version 10.0.0 --no-restore
run dotnet add "$INFRASTRUCTURE_CSPROJ" package "$EF_PROVIDER_PACKAGE" --version 10.0.0 --no-restore

rm -f "$API_DIR/WeatherForecast.cs" "$APPLICATION_DIR/Class1.cs" "$DOMAIN_DIR/Class1.cs" "$INFRASTRUCTURE_DIR/Class1.cs"

mkdir -p \
  "$API_DIR/Features/Todos/Create" \
  "$API_DIR/Features/Todos/GetAll" \
  "$DOMAIN_DIR/Todos" \
  "$INFRASTRUCTURE_DIR/Persistence"

cat > "$DOMAIN_DIR/Todos/TodoItem.cs" <<EOF
namespace ${PROJECT_NAME}.Domain.Todos;

public sealed class TodoItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public bool IsDone { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
EOF

cat > "$INFRASTRUCTURE_DIR/Persistence/AppDbContext.cs" <<EOF
using ${PROJECT_NAME}.Domain.Todos;
using Microsoft.EntityFrameworkCore;

namespace ${PROJECT_NAME}.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<TodoItem> Todos => Set<TodoItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TodoItem>(entity =>
        {
            entity.ToTable("Todos");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.CreatedAtUtc).IsRequired();
        });
    }
}
EOF

cat > "$INFRASTRUCTURE_DIR/DependencyInjection.cs" <<EOF
using ${PROJECT_NAME}.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ${PROJECT_NAME}.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
        {
            ${EF_PROVIDER_LINE}
        });

        return services;
    }
}
EOF

cat > "$API_DIR/Program.cs" <<EOF
using ${PROJECT_NAME}.Api.Features.Todos;
using ${PROJECT_NAME}.Infrastructure;
using ${PROJECT_NAME}.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();
}

if (app.Environment.IsDevelopment())
{
    app.UseCors("frontend");
}

app.MapTodoEndpoints();

app.Run();
EOF

cat > "$API_DIR/Features/Todos/TodoEndpoints.cs" <<EOF
namespace ${PROJECT_NAME}.Api.Features.Todos;

public static class TodoEndpoints
{
    public static IEndpointRouteBuilder MapTodoEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/todos").WithTags("Todos");

        Create.CreateTodoEndpoint.Map(group);
        GetAll.GetAllTodosEndpoint.Map(group);

        return app;
    }
}
EOF

cat > "$API_DIR/Features/Todos/Create/CreateTodoEndpoint.cs" <<EOF
using ${PROJECT_NAME}.Domain.Todos;
using ${PROJECT_NAME}.Infrastructure.Persistence;

namespace ${PROJECT_NAME}.Api.Features.Todos.Create;

public static class CreateTodoEndpoint
{
    public sealed record Request(string Title);
    public sealed record Response(Guid Id, string Title, bool IsDone, DateTime CreatedAtUtc);

    public static RouteGroupBuilder Map(RouteGroupBuilder group)
    {
        group.MapPost("/", async (Request request, AppDbContext db, CancellationToken cancellationToken) =>
        {
            var title = request.Title.Trim();
            if (string.IsNullOrWhiteSpace(title))
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["title"] = new[] { "Title is required." }
                });
            }

            var todo = new TodoItem { Title = title };
            db.Todos.Add(todo);
            await db.SaveChangesAsync(cancellationToken);

            return Results.Created(
                $"/api/todos/{todo.Id}",
                new Response(todo.Id, todo.Title, todo.IsDone, todo.CreatedAtUtc));
        });

        return group;
    }
}
EOF

cat > "$API_DIR/Features/Todos/GetAll/GetAllTodosEndpoint.cs" <<EOF
using ${PROJECT_NAME}.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ${PROJECT_NAME}.Api.Features.Todos.GetAll;

public static class GetAllTodosEndpoint
{
    public sealed record Response(Guid Id, string Title, bool IsDone, DateTime CreatedAtUtc);

    public static RouteGroupBuilder Map(RouteGroupBuilder group)
    {
        group.MapGet("/", async (AppDbContext db, CancellationToken cancellationToken) =>
        {
            var todos = await db.Todos
                .OrderByDescending(x => x.CreatedAtUtc)
                .Select(x => new Response(x.Id, x.Title, x.IsDone, x.CreatedAtUtc))
                .ToListAsync(cancellationToken);

            return Results.Ok(todos);
        });

        return group;
    }
}
EOF

cat > "$API_DIR/appsettings.json" <<EOF
{
  "ConnectionStrings": {
    "DefaultConnection": "$CONNECTION_STRING"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
EOF

cat > "$ROOT_DIR/frontend/package.json" <<EOF
{
  "name": "$PROJECT_SLUG-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.8.0",
    "vite": "^7.0.0"
  }
}
EOF

cat > "$ROOT_DIR/frontend/tsconfig.json" <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true
  },
  "include": ["src", "vite.config.ts"]
}
EOF

cat > "$ROOT_DIR/frontend/vite.config.ts" <<'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173
  }
});
EOF

cat > "$ROOT_DIR/frontend/index.html" <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Desktop Starter</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

cat > "$ROOT_DIR/frontend/src/main.tsx" <<'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

cat > "$ROOT_DIR/frontend/src/App.tsx" <<'EOF'
import { FormEvent, useEffect, useState } from "react";

type TodoItem = {
  id: string;
  title: string;
  isDone: boolean;
  createdAtUtc: string;
};

const API_BASE_URL = "http://127.0.0.1:5000/api/todos";

export default function App() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error("Failed to load todos");
      }
      const data = (await response.json()) as TodoItem[];
      setTodos(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTodos();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }

    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: trimmed })
    });

    if (!response.ok) {
      throw new Error("Failed to create todo");
    }

    setTitle("");
    await loadTodos();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/30">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Electron + React + .NET 10 Starter
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Vertical Slice API + EF Core + Tailwind CSS ready.
            </p>
          </div>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
            TypeScript
          </span>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Write a task"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 active:bg-slate-800"
          >
            Add
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-300/30">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Todos</h2>
          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {todos.length} items
          </span>
        </div>

        {loading && <p className="text-sm text-slate-600">Loading...</p>}
        {!loading && todos.length === 0 && (
          <p className="text-sm text-slate-600">No todos yet.</p>
        )}

        <ul className="divide-y divide-slate-100">
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center justify-between gap-3 py-3">
              <strong className="text-sm font-medium text-slate-800">{todo.title}</strong>
              <span className="text-xs text-slate-500">
                {new Date(todo.createdAtUtc).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
EOF

cat > "$ROOT_DIR/frontend/src/styles.css" <<'EOF'
@import "tailwindcss";

:root {
  color-scheme: light;
}

body {
  margin: 0;
  background: linear-gradient(180deg, #f8fbff 0%, #f1f5f9 100%);
  color: #0f172a;
  font-family: "SF Pro Display", "Segoe UI", sans-serif;
}
EOF

cat > "$ROOT_DIR/desktop/main.cjs" <<EOF
const { app, BrowserWindow } = require("electron");
const { spawn } = require("node:child_process");
const path = require("node:path");

const devServerUrl = process.env.VITE_DEV_SERVER_URL;
let apiProcess = null;

function getApiExecutablePath() {
  if (process.platform === "win32") {
    return path.join(process.resourcesPath, "backend", "${API_PROJECT}.exe");
  }
  return path.join(process.resourcesPath, "backend", "${API_PROJECT}");
}

function startBackend() {
  if (!app.isPackaged) {
    return;
  }

  const executablePath = getApiExecutablePath();
  apiProcess = spawn(executablePath, [], {
    cwd: path.dirname(executablePath),
    env: {
      ...process.env,
      ASPNETCORE_URLS: "http://127.0.0.1:5000"
    },
    stdio: "inherit"
  });
}

function stopBackend() {
  if (apiProcess && !apiProcess.killed) {
    apiProcess.kill("SIGTERM");
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (devServerUrl) {
    window.loadURL(devServerUrl);
    return;
  }

  window.loadFile(path.join(__dirname, "..", "frontend", "dist", "index.html"));
}

app.whenReady().then(() => {
  startBackend();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopBackend();
});
EOF

cat > "$ROOT_DIR/desktop/preload.cjs" <<'EOF'
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("runtime", {
  platform: process.platform
});
EOF

cat > "$ROOT_DIR/package.json" <<EOF
{
  "name": "$PROJECT_SLUG-desktop",
  "version": "0.1.0",
  "private": true,
  "main": "desktop/main.cjs",
  "scripts": {
    "setup": "npm install && npm --prefix frontend install && dotnet restore $SOLUTION_FILENAME",
    "dev": "concurrently -k \\"dotnet run --project backend/src/${API_PROJECT}/${API_PROJECT}.csproj\\" \\"npm --prefix frontend run dev\\" \\"wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .\\"",
    "build:frontend": "npm --prefix frontend run build",
    "build:backend:mac:arm64": "dotnet publish backend/src/${API_PROJECT}/${API_PROJECT}.csproj -c Release -r osx-arm64 --self-contained true /p:PublishSingleFile=true /p:PublishTrimmed=false -o dist/backend",
    "build:backend:mac:x64": "dotnet publish backend/src/${API_PROJECT}/${API_PROJECT}.csproj -c Release -r osx-x64 --self-contained true /p:PublishSingleFile=true /p:PublishTrimmed=false -o dist/backend",
    "pack:mac:arm64": "npm run build:frontend && npm run build:backend:mac:arm64 && electron-builder --mac --arm64",
    "pack:mac:x64": "npm run build:frontend && npm run build:backend:mac:x64 && electron-builder --mac --x64"
  },
  "devDependencies": {
    "concurrently": "^9.1.2",
    "cross-env": "^7.0.3",
    "electron": "^36.3.2",
    "electron-builder": "^26.0.12",
    "wait-on": "^8.0.3"
  }
}
EOF

cat > "$ROOT_DIR/electron-builder.yml" <<EOF
appId: "com.example.$PROJECT_SLUG"
productName: "$PROJECT_NAME"
directories:
  output: "release"
files:
  - "desktop/**"
  - "frontend/dist/**"
  - "package.json"
extraResources:
  - from: "dist/backend"
    to: "backend"
mac:
  category: "public.app-category.developer-tools"
  target:
    - target: "dmg"
      arch:
        - "arm64"
        - "x64"
EOF

cat > "$ROOT_DIR/.gitignore" <<'EOF'
# Node.js / frontend
node_modules/
frontend/node_modules/

# Build outputs
dist/
release/
frontend/dist/

# .NET build
**/bin/
**/obj/

# IDE / OS
.idea/
.vscode/
.DS_Store
Thumbs.db
EOF

cat > "$ROOT_DIR/README.md" <<EOF
# $PROJECT_NAME

Baseline project scaffold for:

- Electron desktop shell
- React renderer (Vite + TypeScript + Tailwind CSS)
- .NET 10 backend API
- Vertical Slice endpoint organization
- EF Core with $DB_DISPLAY_NAME provider

## Project Structure

\`\`\`
$PROJECT_SLUG/
  backend/src/
    $API_PROJECT/
      Features/Todos/
    $APPLICATION_PROJECT/
    $DOMAIN_PROJECT/
    $INFRASTRUCTURE_PROJECT/
  desktop/
  frontend/
  electron-builder.yml
  $SOLUTION_FILENAME
\`\`\`

## First-Time Setup

\`\`\`bash
npm run setup
\`\`\`

## Local Development

\`\`\`bash
npm run dev
\`\`\`

This starts:

- .NET API on \`http://127.0.0.1:5000\`
- Vite renderer on \`http://localhost:5173\`
- Electron shell loading the renderer

## macOS Builds

\`\`\`bash
# Apple Silicon
npm run pack:mac:arm64

# Intel
npm run pack:mac:x64
\`\`\`

Artifacts are written to \`release/\`.
EOF

if [[ "$INIT_GIT" == "true" ]]; then
  (
    cd "$ROOT_DIR"
    run git init
  )
fi

if [[ "$INSTALL_DEPS" == "true" ]]; then
  (
    cd "$ROOT_DIR"
    run npm install
    run npm --prefix frontend install
    run dotnet restore "$SOLUTION_FILE"
  )
fi

echo ""
echo "Scaffold complete."
echo "Project root: $ROOT_DIR"
echo "Database provider: $DB_DISPLAY_NAME"
echo "Next steps:"
echo "  1) cd $ROOT_DIR"
echo "  2) npm run setup"
echo "  3) npm run dev"
