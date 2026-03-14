# GasUndo Kochi

Next.js App Router migration of the GasUndo Kochi map. The UI stays client-heavy for Leaflet, clustering, sheets, and geolocation, while Overpass and Supabase access now run on the server.

## Environment

Create a local `.env.local` or set deployment env vars with:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

The committed `.env.example` lists the same keys without secrets.

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
- `src/lib/restaurants.js` fetches and caches Overpass data on the server.
- `src/lib/statuses.js` handles Supabase reads and writes on the server.
- `src/app/api/statuses/*` and `src/app/api/comments/*` expose same-origin routes for authenticated community actions with Upstash-backed rate limiting.
