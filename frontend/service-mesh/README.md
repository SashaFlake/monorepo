# Service Mesh — Admin UI

Control plane admin interface.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **TanStack Router** — type-safe file-based routing
- **TanStack Query** + localStorage persist — local-first cache
- **Zustand** — UI state (sidebar, selections)
- **Tailwind v4** — utility CSS
- **Lucide React** — icons

## Getting Started

```bash
npm install
npm run dev
```

## Structure

```
src/
  routes/        # File-based routes (TanStack Router)
  components/
    layout/      # Sidebar, Header
    ui/          # Card, Badge, Button
  lib/           # queryClient (TanStack Query + persist)
  store/         # Zustand stores
```

## Screens

| Route | Screen |
|---|---|
| `/` | Dashboard — KPIs + services overview |
| `/services` | Services & instances |
| `/routes` | Traffic routing rules |
| `/policies` | Retry, timeout, access policies |
| `/revisions` | Config history & publish lifecycle |
| `/nodes` | Connected data plane nodes |
