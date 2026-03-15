'use client'

import { useState } from 'react'

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

export default function LocateButton({ onLocate, onError }) {
  const [locating, setLocating] = useState(false)

  const handleLocate = async () => {
    setLocating(true)

    try {
      await onLocate?.()
    } catch (error) {
      console.error('Failed to get the user location:', error)
      setLocating(false)
      onError?.('Could not get your location. Please enable GPS or location access.')
      return
    }

    setLocating(false)
  }

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={locating}
      className={`pointer-events-auto locate-button ${locating ? 'is-locating' : ''}`}
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
