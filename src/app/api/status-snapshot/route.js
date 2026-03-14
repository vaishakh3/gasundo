import { NextResponse } from 'next/server'

import { createStrongEtag, isEtagFresh } from '@/lib/http-cache'
import { getAuthenticatedViewer } from '@/lib/supabase-auth'
import {
  applyViewerStatusState,
  getViewerStatusState,
  loadLatestStatusSnapshot,
} from '@/lib/statuses'

export const runtime = 'nodejs'

const CACHE_CONTROL = 'private, no-cache, max-age=0, must-revalidate'
const VARY_HEADER = 'Accept, Cookie'

export async function GET(request) {
  try {
    const snapshot = await loadLatestStatusSnapshot()
    const viewer = await getAuthenticatedViewer()
    let statuses = snapshot.statuses

    if (viewer) {
      const viewerStateByStatusId = await getViewerStatusState(
        Object.values(snapshot.statuses || {})
          .map((status) => status?.id)
          .filter(Boolean),
        viewer.identityKey
      )

      statuses = Object.fromEntries(
        Object.entries(snapshot.statuses || {}).map(([restaurantKey, status]) => [
          restaurantKey,
          applyViewerStatusState(status, viewerStateByStatusId.get(status?.id)),
        ])
      )
    }

    const snapshotVersion = createStrongEtag(statuses).slice(1, -1)
    const etag = `"${snapshotVersion}"`
    const headers = {
      'Cache-Control': CACHE_CONTROL,
      ETag: etag,
      Vary: VARY_HEADER,
    }

    if (isEtagFresh(request.headers.get('if-none-match'), etag)) {
      return new NextResponse(null, { status: 304, headers })
    }

    return NextResponse.json(
      {
        generatedAt: snapshot.generatedAt,
        snapshotVersion,
        statuses,
      },
      { headers }
    )
  } catch (error) {
    console.error('Failed to load latest status snapshot:', error)
    return NextResponse.json(
      { error: 'Could not load the latest status snapshot right now.' },
      { status: 500 }
    )
  }
}
