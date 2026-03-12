'use client'

import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { useEffect } from 'react'
import L from 'leaflet'

import { DEFAULT_MAP_ZOOM, KOCHI_CENTER } from '@/lib/constants'
import { buildStatusKey } from '@/lib/status-key'

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

  return null
}

export default function MapView({
  restaurants,
  statusMap,
  onSelectRestaurant,
  selectedRestaurant,
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
        {restaurants.map((r) => {
          const key = buildStatusKey(r.lat, r.lng)
          const statusData = statusMap[key]
          const status = statusData?.status || 'unknown'

          return (
            <RestaurantMarker
              key={`${r.id}_${key}`}
              restaurant={r}
              status={status}
              isSelected={selectedRestaurant?.id === r.id}
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
