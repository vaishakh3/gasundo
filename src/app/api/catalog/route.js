import { NextResponse } from 'next/server'

import { createStrongEtag, isEtagFresh } from '@/lib/http-cache'
import { getRestaurants } from '@/lib/restaurants'

export const runtime = 'nodejs'

const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=86400'

export async function GET(request) {
  try {
    const restaurants = await getRestaurants()
    const catalogVersion = createStrongEtag(restaurants).slice(1, -1)
    const etag = `"${catalogVersion}"`
    const headers = {
      'Cache-Control': CACHE_CONTROL,
      ETag: etag,
    }

    if (isEtagFresh(request.headers.get('if-none-match'), etag)) {
      return new NextResponse(null, { status: 304, headers })
    }

    return NextResponse.json(
      {
        catalogVersion,
        restaurants,
      },
      { headers }
    )
  } catch (error) {
    console.error('Failed to load catalog snapshot:', error)
    return NextResponse.json(
      { error: 'Could not load the restaurant catalog right now.' },
      { status: 500 }
    )
  }
}
