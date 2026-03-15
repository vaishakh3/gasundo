'use client'

import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useEffect } from 'react'
import L from 'leaflet'

import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import { getDistrictConfig } from '@/lib/districts'

import LocateButton from './LocateButton'
import RestaurantMarker from './RestaurantMarker'
import ZoomControl from './ZoomControl'

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

function MapController({ selectedRestaurant, viewportRequest }) {
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
    if (!viewportRequest?.id || viewportRequest.kind !== 'district') {
      return
    }

    const district = getDistrictConfig(viewportRequest.districtSlug)

    map.flyTo(district.mapCenter, DEFAULT_MAP_ZOOM, {
      animate: true,
      duration: 1,
    })
  }, [map, viewportRequest])

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
  district,
  viewportRequest,
  restaurantIds,
  restaurantsById,
  statusMap,
  onSelectRestaurant,
  selectedRestaurant,
  selectedRestaurantId,
  onLocateSuccess,
  onLocateError,
}) {
  return (
    <MapContainer
      center={district?.mapCenter || DEFAULT_MAP_CENTER}
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
      <ZoomControl />
      <LocateButton onError={onLocateError} onSuccess={onLocateSuccess} />
      <MapController
        selectedRestaurant={selectedRestaurant}
        viewportRequest={viewportRequest}
      />
    </MapContainer>
  )
}
