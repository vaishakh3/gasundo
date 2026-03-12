import { NextResponse } from 'next/server'

import { createStrongEtag, isEtagFresh } from '@/lib/http-cache'
import { getLatestStatusSnapshot } from '@/lib/statuses'

export const runtime = 'nodejs'

const CACHE_CONTROL = 'public, s-maxage=15, stale-while-revalidate=45'

export async function GET(request) {
  try {
    const snapshot = await getLatestStatusSnapshot()
    const snapshotVersion = createStrongEtag(snapshot.statuses).slice(1, -1)
    const etag = `"${snapshotVersion}"`
    const headers = {
      'Cache-Control': CACHE_CONTROL,
      ETag: etag,
    }

    if (isEtagFresh(request.headers.get('if-none-match'), etag)) {
      return new NextResponse(null, { status: 304, headers })
    }

    return NextResponse.json(
      {
        generatedAt: snapshot.generatedAt,
        snapshotVersion,
        statuses: snapshot.statuses,
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
