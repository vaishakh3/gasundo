# GasUndo Kochi

Next.js App Router migration of the GasUndo Kochi map. The UI stays client-heavy for Google Maps, clustering, sheets, and geolocation, while the restaurant catalog and Supabase access run on the server.

## Environment

Create a local `.env.local` or set deployment env vars with:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=
RESTAURANT_CATALOG_GRID_MAX_DEPTH=
RESTAURANT_CATALOG_GRID_MIN_RADIUS_METERS=
```

The committed `.env.example` lists the same keys without secrets.

Use separate Google keys when possible:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for the browser map. Restrict it by HTTP referrer.
- `GOOGLE_MAPS_API_KEY` for the server-side Places catalog sync. Do not use a referrer-locked browser key here.
- `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` is optional. If omitted, the app falls back to `DEMO_MAP_ID`.
- `RESTAURANT_CATALOG_GRID_MAX_DEPTH` is optional. Higher values crawl dense areas more deeply but increase Places API usage.
- `RESTAURANT_CATALOG_GRID_MIN_RADIUS_METERS` is optional. Lower values inspect dense neighborhoods more precisely but increase Places API usage.

Apply the latest Supabase migrations before running the app. The restaurant catalog now lives in Supabase and is refreshed from Google Places when the stored snapshot is older than one day.

Enable Google Auth in the Supabase dashboard with these production values:

- Supabase Auth `Site URL`: `https://gasundo.live`
- Supabase Auth redirect URLs:
  `http://localhost:3000/auth/callback`,
  `https://gasundo.live/auth/callback`
- Google OAuth authorized JavaScript origins:
  `http://localhost:3000`,
  `https://gasundo.live`
- Google OAuth authorized redirect URI:
  `https://vdtteszflcvbkwbkoaig.supabase.co/auth/v1/callback`

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Architecture

- `src/app/page.jsx` renders the home page through the App Router.
- `src/app/home-client.jsx` owns the interactive map/filter/sheet state.
- `src/lib/restaurants.js` reads the restaurant catalog from Supabase, syncs it from Google Places when stale, and falls back to a direct Google fetch or bundled snapshot if needed.
- `src/lib/statuses.js` handles Supabase reads and writes on the server.
- `src/app/api/statuses/*` and `src/app/api/comments/*` expose same-origin routes for authenticated community actions with Upstash-backed rate limiting.
