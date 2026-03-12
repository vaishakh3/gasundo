'use client'

import { Marker } from 'react-leaflet'
import L from 'leaflet'

import { getStatusMeta } from '@/lib/status-ui'

const brandLogos = {
  "McDonald's": "/logos/mcdonalds.png",
  "KFC": "/logos/kfc.png",
  "Burger King": "/logos/burgerking.png",
  "Subway": "/logos/subway.png",
  "Domino's": "/logos/dominos.png",
  "Pizza Hut": "/logos/pizzahut.png",
  "Starbucks": "/logos/starbucks.png",
}

const STATUS_RING_COLORS = {
  'open': '#22c55e',
  'limited': '#eab308',
  'closed': '#ef4444',
  'unknown': '#6b7280',
}

const iconCache = {}

function createRingIcon(restaurant, status, isSelected) {
  const ringColor = STATUS_RING_COLORS[status] || STATUS_RING_COLORS.unknown
  const hasBrand = restaurant.brand && brandLogos[restaurant.brand]
  const iconUrl = hasBrand ? brandLogos[restaurant.brand] : '/default-marker.png'
  const size = isSelected ? 58 : 46
  const imageSize = isSelected ? 34 : 28
  const borderWidth = isSelected ? 4 : 3
  const cacheKey = `${iconUrl}_${status}_${isSelected ? 'selected' : 'default'}`

  if (iconCache[cacheKey]) return iconCache[cacheKey]

  const html = `
    <div style="
      width: ${size}px; height: ${size}px;
      border-radius: 50%;
      border: ${borderWidth}px solid ${ringColor};
      background: rgba(247, 250, 252, 0.98);
      display: flex; align-items: center; justify-content: center;
      box-shadow: ${
        isSelected
          ? `0 0 0 8px rgba(255,122,69,0.18), 0 20px 44px rgba(5,8,22,0.36)`
          : `0 12px 26px rgba(5,8,22,0.28)`
      };
    ">
      <img src="${iconUrl}" alt="" aria-hidden="true" style="width: ${imageSize}px; height: ${imageSize}px; border-radius: 50%; object-fit: cover;" />
    </div>
  `

  iconCache[cacheKey] = L.divIcon({
    html,
    className: 'custom-ring-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })

  return iconCache[cacheKey]
}

export default function RestaurantMarker({ restaurant, status, isSelected, onClick }) {
  const statusMeta = getStatusMeta(status)

  return (
    <Marker
      position={[restaurant.lat, restaurant.lng]}
      icon={createRingIcon(restaurant, status, isSelected)}
      title={`${restaurant.name}: ${statusMeta.label}`}
      alt={`${restaurant.name}: ${statusMeta.label}`}
      keyboard
      eventHandlers={{
        click: () => onClick(restaurant),
      }}
    />
  )
}
