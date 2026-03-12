'use client'

import { useMap } from 'react-leaflet'
import { useState } from 'react'
import L from 'leaflet'

let userMarker = null
let userAccuracyCircle = null

export default function LocateButton({ onError }) {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const handleLocate = () => {
    setLocating(true)

    map.locate({ setView: false, maxZoom: 16, enableHighAccuracy: true })

    map.once('locationfound', (e) => {
      setLocating(false)

      if (userMarker) {
        map.removeLayer(userMarker)
      }
      if (userAccuracyCircle) {
        map.removeLayer(userAccuracyCircle)
      }

      userMarker = L.circleMarker(e.latlng, {
        radius: 10,
        fillColor: '#3b82f6',
        fillOpacity: 0.9,
        color: '#fff',
        weight: 3,
        className: 'user-location-marker',
      }).addTo(map)

      userAccuracyCircle = L.circle(e.latlng, {
        radius: e.accuracy / 2,
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        color: '#3b82f6',
        weight: 1,
      }).addTo(map)

      map.flyTo(e.latlng, 15, { duration: 1 })
    })

    map.once('locationerror', () => {
      setLocating(false)
      onError?.('Could not get your location. Please enable GPS or location access.')
    })
  }

  return (
    <button
      onClick={handleLocate}
      disabled={locating}
      className="locate-button"
      aria-label="Find my location"
    >
      {locating ? (
        <span className="locate-spinner" />
      ) : (
        '📍'
      )}
    </button>
  )
}
