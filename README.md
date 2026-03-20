# Zeus Dashboard

ITSM analytics dashboard for ageing tickets across assignment groups.

## Run locally

1. Install dependencies with `pnpm install`
2. Start the app with `pnpm dev`
3. Open the local Vite URL shown in the terminal

## Environment

Create a `.env` file if you need to point the dashboard at a real API:

```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_TICKETS_PATH=/api/tickets
VITE_TICKETS_DATA_PATH=data
VITE_API_AUTH_HEADER=Authorization
VITE_API_AUTH_VALUE=Bearer your-token
VITE_TICKETS_PAGE_PARAM=page
VITE_TICKETS_PAGE_START=1
VITE_USE_MOCK_DATA=false
```

Set `VITE_USE_MOCK_DATA=true` for local UI development without the backend.

## Assumptions

- Ticket records can arrive either as a top-level array or under a configurable nested path like `data`.
- Paginated APIs can either expose `has_more`/`total_pages` style metadata or simply stop returning records on the last page.
- `created_at` is required for ageing. Records missing `id` or `created_at` are skipped.
- Closed lifecycle is inferred from `closed_at`, `resolved_at`, or a status containing common closed keywords.
- Ageing buckets are defined in [`src/config/dashboard.ts`](/Users/vvelan/Projects/Zeus Dashboard/src/config/dashboard.ts) and can be edited without changing the rest of the dashboard.
