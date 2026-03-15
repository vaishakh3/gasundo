'use client'

import { useMap } from 'react-leaflet'
import { useState } from 'react'
import L from 'leaflet'

let userMarker = null
let userAccuracyCircle = null

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="locate-button__icon">
      <path
        d="M12 3.25c.41 0 .75.34.75.75v1.64a6.37 6.37 0 0 1 5.61 5.61H20a.75.75 0 0 1 0 1.5h-1.64a6.37 6.37 0 0 1-5.61 5.61V20a.75.75 0 0 1-1.5 0v-1.64a6.37 6.37 0 0 1-5.61-5.61H4a.75.75 0 0 1 0-1.5h1.64a6.37 6.37 0 0 1 5.61-5.61V4c0-.41.34-.75.75-.75Zm0 3.75A4.99 4.99 0 0 0 7 12a5 5 0 1 0 5-5Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="1.85" fill="#090f20" />
    </svg>
  )
}

export default function LocateButton({ onError, onSuccess }) {
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

      onSuccess?.({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        accuracy: e.accuracy,
      })

      map.flyTo(e.latlng, 15, { duration: 1 })
    })

    map.once('locationerror', () => {
      setLocating(false)
      onError?.('Could not get your location. Please enable GPS or location access.')
    })
  }

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={locating}
      className={`locate-button ${locating ? 'is-locating' : ''}`}
      aria-label={locating ? 'Finding your location' : 'Use my location'}
      title={locating ? 'Finding your location' : 'Use my location'}
    >
      <span className="locate-button__halo" aria-hidden="true" />
      <span className="locate-button__pulse" aria-hidden="true" />
      <span className="locate-button__core">
        {locating ? <span className="locate-spinner" /> : <LocateIcon />}
      </span>
      <span className="locate-button__content">
        <span className="locate-button__eyebrow">Live GPS</span>
        <span className="locate-button__label">
          {locating ? 'Finding you' : 'Locate me'}
        </span>
      </span>
    </button>
  )
}
