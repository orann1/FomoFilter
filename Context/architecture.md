# Architecture — FomoFilter

## When To Read This File

Read this file before changing:

```txt
App data flow
Server/client boundaries
Provider call locations
Routes
Server Actions
API routes
Prisma access patterns
Major component ownership
```

Do not read this file for small UI-only copy/style changes unless the change touches data flow.

---

## When To Update This File

Update this file after QA and before commit approval if you change:

```txt
How data flows through the app
Where provider calls happen
Where Prisma is accessed
Route structure
Server Action patterns
API route patterns
Scanner/Dashboard/Drawer data ownership
Sync architecture
```

---

## Core Architecture Principle

Normal UI render paths must read from the database only.

```txt
External Providers / Static Sources
        ↓
Admin Sync Workflows / Future Scheduled Jobs
        ↓
Database
        ↓
Dashboard / Scanner / Drawer / Alerts
```

Do not call external market data providers directly from:

```txt
Scanner render path
Dashboard render path
Drawer render path
Client components
Regular page rendering
```

Provider calls belong in:

```txt
Admin sync workflows
Future scheduled jobs
Explicit approved enrichment flows with DB persistence
Provider test actions
```

---

## Current Stack

```txt
Next.js App Router
TypeScript
Tailwind CSS v4
Prisma ORM
PostgreSQL / Neon
lucide-react
```

---

## Route Overview

| Route | Status | Purpose |
| --- | --- | --- |
| `/` | Implemented | Dashboard overview |
| `/scanner` | Implemented | Main stock discovery workspace |
| `/admin/sync` | Implemented | Admin sync, provider tests, data inventory, methodology |
| Drawer from scanner/dashboard | Implemented, cleanup in Phase 21C | Single-stock preview / decision workspace |
| `/stocks/[symbol]` | Future | Full stock details page |
| `/watchlist` | Future | Dedicated watchlist screen |
| `/alerts` | Future | Alert management |

---

## Server Components vs Client Components

### Server Components

Use Server Components for:

```txt
Page-level DB loading
Initial route data
Dashboard data
Scanner initial data
Admin page initial data
```

Server Components may call Prisma through server-side data loaders.

### Client Components

Use Client Components for:

```txt
Scanner filtering/sorting/pagination
Drawer open/close state
Expanded row state
Watchlist/action panels
Form state
Mobile sidebar state
Interactive controls
```

Client components must not import Prisma.

Client components must not call market data providers.

---

## Prisma Access Rules

Prisma access belongs in:

```txt
src/lib/data/*
src/actions/*
app/api/* route handlers
prisma/seed.ts
```

Do not access Prisma from:

```txt
Client components
UI-only components
Utility files used by client components
```

Use normalized plain objects for UI data contracts.

---

## API Route Usage

Use API routes for:

```txt
Chunked/resumable sync workflows
Long-running data jobs
Provider-backed admin workflows
Polling sync status
Specific HTTP status/response needs
Future external webhook endpoints
```

Current examples:

```txt
Admin sync start/process-next/latest routes
Analyst/company data sync route
Daily market data sync route
Provider test endpoints/actions
```

---

## Server Action Usage

Use Server Actions for:

```txt
Simple mutations
Watchlist actions
Alert rule creation/editing
Small admin actions
Score calculation actions
```

Server Actions should return a structured result:

```ts
{ success: boolean; data?: T; error?: string }
```

---

## State Ownership

| State/Data | Owner |
| --- | --- |
| Stock identity | DB `Stock` |
| Latest quote | DB `StockQuote` |
| Fundamentals / ratios / growth | DB `StockMetric` |
| Analyst targets / ratings | DB `StockAnalystData` |
| Scores | DB `StockScore` |
| Universe membership | DB `StockUniverse` / `StockUniverseMember` |
| Watchlist state | DB `WatchlistItem` |
| Alert rules | DB `AlertRule` |
| Sync history | DB `SyncRun` / `SyncRunItem` |
| Scanner search/filter/sort/page | Client state |
| Expanded row open state | Client state |
| Drawer open state | Client state |
| Theme/UI preferences | Future localStorage only if needed |

---

## Current Data Flow By Screen

### Dashboard

```txt
Server page/loaders
→ Prisma
→ normalized dashboard data
→ Dashboard components
```

Dashboard should not call providers.

### Scanner

```txt
Server page/loaders
→ Prisma
→ normalized scanner stock objects
→ client-side search/filter/sort/pagination
→ table / mobile cards / expanded row
```

Scanner should not call providers.

### Drawer

Current drawer is partly legacy and should be cleaned in Phase 21C.

Target flow:

```txt
Scanner/Dashboard selected stock data
→ Drawer client state
→ real DB-backed stock fields
→ watchlist/alert Server Actions for mutations
```

Drawer should not call providers in Phase 21C.

### Admin Sync

```txt
Admin UI
→ start sync
→ process chunks / poll latest
→ provider calls server-side
→ DB writes
→ SyncRun / SyncRunItem history
```

---

## Provider Boundary

Provider clients should stay isolated in:

```txt
src/lib/market-data/providers/*
```

Provider composition should happen in:

```txt
Admin sync route handlers
Server-side sync orchestration code
```

Provider clients should not import UI components.

UI components should not import provider clients.

---

## Documentation Links

For more detail:

```txt
Context/data-model.md
Context/sync-workflows.md
Context/Features/market-data-sync-strategy.md
Context/Features/scanner-feature-spec.md
Context/Features/drawer-feature-spec.md
```
