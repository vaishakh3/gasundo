import { NextResponse } from 'next/server'

import { importRestaurantToDbByPlaceId } from '@/lib/restaurants'

export const runtime = 'nodejs'

export async function POST(request) {
  try {
    const payload = await request.json()
    const placeId =
      typeof payload?.placeId === 'string' ? payload.placeId.trim() : ''

    if (!placeId) {
      return NextResponse.json(
        { error: 'A Google place id is required.' },
        { status: 400 }
      )
    }

    const restaurant = await importRestaurantToDbByPlaceId(placeId)

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error('Failed to import a Google place into the restaurant catalog:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not import this place right now.',
      },
      { status: 500 }
    )
  }
}
