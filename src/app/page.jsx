import HomeClient from './home-client'

import { getRestaurants } from '@/lib/restaurants'

export const revalidate = 86400

export default async function Page() {
  let initialRestaurants = []
  let initialError = null

  try {
    initialRestaurants = await getRestaurants()
  } catch (error) {
    console.error('Failed to load restaurants on the server:', error)
    initialError = 'Failed to load restaurants. Please try again.'
  }

  return (
    <HomeClient
      initialRestaurants={initialRestaurants}
      initialError={initialError}
    />
  )
}
