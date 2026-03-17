# GasUndo

GasUndo is a Next.js 16 web app and installable PWA for tracking crowd-reported restaurant availability during the Kerala LPG shortage.

The app combines:

- district-wise restaurant catalog data from OpenStreetMap via Overpass
- community status reports for `open`, `limited`, and `closed`
- Google sign-in through Supabase Auth for reporting, confirming, and commenting
- server-side caching, analytics, and rate-limited write APIs

The current production site is `https://gasundo.live`.

## What It Does

- Loads mapped food places district by district across Kerala.
- Shows the latest known status for each restaurant on a Leaflet map and in searchable lists.
- Lets signed-in users post a fresh status, confirm someone else's report, and discuss a place in comments.
- Tracks lightweight usage analytics such as place opens, status updates, and confirmations.
- Ships with a web manifest, icons, splash assets, and a production service worker for basic PWA behavior.

## Stack

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Leaflet + React Leaflet
- TanStack Query
- Zustand
- Supabase Auth + database
- Upstash Redis rate limiting
- Vercel Analytics

## Repository Layout

- `src/app`: App Router pages, metadata, and API routes
- `src/app/home-client.jsx`: main client shell for map, filters, selection, and mutations
- `src/components`: map, sheet, panel, auth, and comment UI
- `src/lib/restaurants.js`: Overpass catalog loading with a bundled fallback for the default district
- `src/lib/statuses.js`: status snapshot reads, writes, confirmations, and projection sync
- `src/lib/comments.js`: threaded restaurant comments and upvotes
- `src/lib/analytics.js`: server-side analytics counter writes and reads
- `src/data/restaurants-kochi.json`: fallback catalog used when live catalog loading fails for Ernakulam
- `supabase/migrations`: SQL migrations for projections, comments, confirmations, analytics, and rate-limit helpers
- `supabase/functions/update-status`: legacy edge function kept in the repo; the active app writes through Next API routes instead

## Local Development

### Prerequisites

- Node.js LTS and npm
- A Supabase project
- Google OAuth credentials connected to Supabase Auth
- Upstash Redis for production-like rate limiting

### Install

```bash
npm install
```

### Environment Variables

Create `.env.local` and start from the committed `.env.example`.

Required for normal app behavior:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANALYTICS_READ_TOKEN=your-analytics-admin-token
```

Required when rate limits are enabled:

```bash
UPSTASH_REDIS_REST_URL=https://your-upstash-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

Optional:

```bash
ENABLE_RATE_LIMITS=true
RESTAURANT_CATALOG_OVERPASS_URL=https://overpass-api.de/api/interpreter
RESTAURANT_CATALOG_FETCH_TIMEOUT_MS=20000
RESTAURANT_CATALOG_OVERPASS_TIMEOUT_SECONDS=60
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Notes:

- In non-production environments, rate limiting is bypassed unless `ENABLE_RATE_LIMITS=true`.
- Server-side Supabase access falls back to the anon key if `SUPABASE_SERVICE_ROLE_KEY` is missing, but authenticated writes may fail depending on your RLS setup. Use the service role key for real deployments.
- The browser auth layer can use either `NEXT_PUBLIC_SUPABASE_*` or the plain `SUPABASE_*` values because the layout passes the public config down explicitly.

### Database Setup

Apply the SQL files in `supabase/migrations` in filename order.

Those migrations create or update:

- latest-status projection tables and sync functions
- comment tables and upvote RPCs
- status confirmation tables and RPCs
- analytics counter tables and RPCs
- a legacy database-backed rate-limit helper used by the old edge function

Important: the checked-in migrations do **not** create the original `public.restaurant_status` table from scratch. They assume it already exists and has the fields the app reads and writes, including at least:

- `id`
- `restaurant_name`
- `lat`
- `lng`
- `status`
- `note`
- `confirmations`
- `updated_at`

The migrations then add newer columns such as `created_at`, `restaurant_key`, and `author_identity_hash`.

### Supabase Auth and Google OAuth

Enable Google Auth in Supabase and configure your site URLs to match your local and deployed domains.

For the current production deployment:

- Supabase Auth `Site URL`: `https://gasundo.live`
- Supabase Auth redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://gasundo.live/auth/callback`
- Google OAuth authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://gasundo.live`
- Google OAuth authorized redirect URI:
  - `https://vdtteszflcvbkwbkoaig.supabase.co/auth/v1/callback`

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run test
npm run build
npm run start
```

Utility scripts:

- `node build-splash.js <source-image>`: generate iOS splash images into `public/splash`
- `node extract-links.js`: convert startup image link markup into the `metadata.appleWebApp.startupImage` format used in `src/app/layout.jsx`

## API Overview

Read endpoints:

- `GET /api/catalog?district=<slug>`: district catalog snapshot with ETag caching
- `GET /api/status-snapshot`: latest status snapshot, including viewer-specific confirmation flags when authenticated
- `GET /api/comments?restaurantKey=<key>&cursor=<cursor>`: paginated comments for a restaurant
- `GET /api/admin/analytics/counters?...`: protected analytics read endpoint using `Authorization: Bearer <ANALYTICS_READ_TOKEN>`

Write endpoints:

- `POST /api/statuses`: create a status update
- `POST /api/statuses/:id/confirm`: confirm an existing status update
- `POST /api/analytics/place-open`: record a place-open event
- `POST /api/comments`: create a comment
- `PATCH /api/comments/:id`: edit your own comment
- `DELETE /api/comments/:id`: delete your own comment
- `POST /api/comments/:id/upvote`: upvote someone else's comment

All write routes are same-origin Next route handlers and expect Supabase-authenticated users where applicable.

## Data Flow

1. The server loads the initial district catalog from Overpass through `src/lib/restaurants.js`.
2. `src/app/page.jsx` server-renders the first payload and hands it to `src/app/home-client.jsx`.
3. The client hydrates TanStack Query for catalog, status snapshot, comments, and mutations.
4. Statuses and comments are stored in Supabase, with latest status reads coming from `restaurant_latest_status` when available.
5. Analytics counters are aggregated in Supabase through RPCs.

## Operational Notes

- Catalog data is cached for 24 hours.
- Status snapshot data is cached for 15 seconds server-side and enriched per viewer when authenticated.
- If Overpass fails, only the default district has a bundled fallback catalog. Other districts will return an error until live catalog loading succeeds.
- Coverage depends on OpenStreetMap data quality. Missing places generally need to be mapped in OSM first.
- The production service worker is only registered in `NODE_ENV=production`.

## Testing

The repo currently includes unit tests for validation, analytics helpers, cache helpers, auth-viewer logic, status keys, markdown handling, and related utility modules:

```bash
npm run test
```
