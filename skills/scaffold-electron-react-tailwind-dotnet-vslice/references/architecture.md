# Architecture Reference

## Folder Layout

Use this structure for deterministic scaffolding:

```text
<project>/
  backend/
    src/
      <Project>.Api/
      <Project>.Application/
      <Project>.Domain/
      <Project>.Infrastructure/
  desktop/
  frontend/
```

Frontend baseline:

- React
- TypeScript
- Tailwind CSS
- Vite

## Vertical Slice Rules

Place feature slices under `Api/Features/<Feature>/<UseCase>/`.

Example:

```text
Api/Features/Todos/Create/CreateTodoEndpoint.cs
Api/Features/Todos/GetAll/GetAllTodosEndpoint.cs
```

Keep each slice self-contained:

- Request/response contracts close to handler endpoint
- Feature-specific validation in the same slice
- Shared infrastructure in `Infrastructure/`

## Layer Responsibilities

- `<Project>.Domain`: Entities and domain rules
- `<Project>.Application`: Contracts and use-case abstractions
- `<Project>.Infrastructure`: EF Core, persistence, and provider config
- `<Project>.Api`: HTTP endpoints and composition root

## EF Core Provider Strategy

Support one provider per scaffold run:

- `sqlite`: Use `Microsoft.EntityFrameworkCore.Sqlite` and local `app.db`
- `mssql`: Use `Microsoft.EntityFrameworkCore.SqlServer` and SQL Server connection string

Put provider-specific `UseSqlite` or `UseSqlServer` in `Infrastructure/DependencyInjection.cs`.
