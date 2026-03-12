'use client'

import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useEffect } from 'react'
import L from 'leaflet'

import { DEFAULT_MAP_ZOOM, KOCHI_CENTER } from '@/lib/constants'

import LocateButton from './LocateButton'
import RestaurantMarker from './RestaurantMarker'

const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount()

  return L.divIcon({
    html: `
      <div class="custom-cluster-core" aria-label="${count} restaurants in this cluster">
        <span>${count}</span>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(54, 54, true),
  })
}

// Helper component to handle imperative map operations
function MapController({ selectedRestaurant }) {
  const map = useMap()

  useEffect(() => {
    if (selectedRestaurant) {
      map.flyTo([selectedRestaurant.lat, selectedRestaurant.lng], 16, {
        animate: true,
        duration: 1,
      })
    }
  }, [selectedRestaurant, map])

  useEffect(() => {
    let frameId = 0

    const syncMapSize = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        map.invalidateSize({ pan: false })
      })
    }

    const viewport = window.visualViewport

    syncMapSize()
    window.addEventListener('resize', syncMapSize)
    window.addEventListener('orientationchange', syncMapSize)
    viewport?.addEventListener('resize', syncMapSize)
    viewport?.addEventListener('scroll', syncMapSize)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('resize', syncMapSize)
      window.removeEventListener('orientationchange', syncMapSize)
      viewport?.removeEventListener('resize', syncMapSize)
      viewport?.removeEventListener('scroll', syncMapSize)
    }
  }, [map])

  return null
}

export default function MapView({
  restaurantIds,
  restaurantsById,
  statusMap,
  onSelectRestaurant,
  selectedRestaurant,
  selectedRestaurantId,
  onLocateError,
}) {
  return (
    <MapContainer
      center={KOCHI_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      className="map-container"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        iconCreateFunction={createClusterCustomIcon}
      >
        {restaurantIds.map((restaurantId) => {
          const restaurant = restaurantsById[restaurantId]

          if (!restaurant) {
            return null
          }

          const statusData = statusMap[restaurant.restaurant_key]
          const status = statusData?.status || 'unknown'

          return (
            <RestaurantMarker
              key={restaurant.restaurant_key}
              restaurant={restaurant}
              status={status}
              isSelected={selectedRestaurantId === restaurant.restaurant_key}
              onClick={onSelectRestaurant}
            />
          )
        })}
      </MarkerClusterGroup>
      <LocateButton onError={onLocateError} />
      <MapController selectedRestaurant={selectedRestaurant} />
    </MapContainer>
  )
}
