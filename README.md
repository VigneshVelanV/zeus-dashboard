# Zeus Dashboard

ITSM analytics dashboard for ageing tickets across assignment groups.

## Run locally

1. Install dependencies with `pnpm install`
2. Start the app with `pnpm dev`
3. Open the local Vite URL shown in the terminal

## Environment

For local UI development without a backend, set:

```bash
VITE_USE_MOCK_DATA=true
```

To use the real Atomicwork API locally, create a `.env.local` file:

```bash
ATOMICWORK_PROXY_TARGET=https://your-company.atomicwork.com
ATOMICWORK_API_KEY=your-server-side-api-key
ATOMICWORK_TICKETS_PATH=/api/v1/workspaces/318/requests/list?sort_order=CREATED_AT_DESC&page={pagenumber}&filter_name=all&is_problem=false

VITE_API_BASE_URL=
VITE_TICKETS_PATH=/api/tickets
VITE_TICKETS_DATA_PATH=data
VITE_TICKETS_PAGE_PARAM=page
VITE_TICKETS_PAGE_START=1
VITE_USE_MOCK_DATA=false
```

The browser calls `/api/tickets`. In local dev, Vite proxies that route. On Vercel, `api/tickets.ts` handles it as a serverless function, so `ATOMICWORK_API_KEY` stays server-side.

## Vercel

Set these environment variables in Vercel:

```bash
ATOMICWORK_PROXY_TARGET=https://your-company.atomicwork.com
ATOMICWORK_API_KEY=your-server-side-api-key
ATOMICWORK_TICKETS_PATH=/api/v1/workspaces/318/requests/list?sort_order=CREATED_AT_DESC&page={pagenumber}&filter_name=all&is_problem=false

VITE_TICKETS_PATH=/api/tickets
VITE_TICKETS_DATA_PATH=data
VITE_TICKETS_PAGE_PARAM=page
VITE_TICKETS_PAGE_START=1
VITE_USE_MOCK_DATA=false
```

Vercel settings:

1. Framework preset: `Vite`
2. Build command: `pnpm build`
3. Output directory: `dist`

## Assumptions

- Ticket records can arrive either as a top-level array or under a configurable nested path like `data`.
- Paginated APIs can either expose `has_more`/`total_pages` style metadata or simply stop returning records on the last page.
- `created_at` is required for ageing. Records missing `id` or `created_at` are skipped.
- Closed lifecycle is inferred from `closed_at`, `resolved_at`, or a status containing common closed keywords.
- Ageing buckets are defined in [`src/config/dashboard.ts`](/Users/vvelan/Projects/Zeus Dashboard/src/config/dashboard.ts) and can be edited without changing the rest of the dashboard.
