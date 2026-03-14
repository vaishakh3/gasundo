'use client'

import { useEffect, useState } from 'react'
import { useMap } from 'react-leaflet'

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M12 5.25a.75.75 0 0 1 .75.75v5.25H18a.75.75 0 0 1 0 1.5h-5.25V18a.75.75 0 0 1-1.5 0v-5.25H6a.75.75 0 0 1 0-1.5h5.25V6a.75.75 0 0 1 .75-.75Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path
        d="M6 11.25a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5H6Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ZoomControl() {
  const map = useMap()
  const [zoomLevel, setZoomLevel] = useState(() => map.getZoom())

  useEffect(() => {
    const syncZoomLevel = () => {
      setZoomLevel(map.getZoom())
    }

    map.on('zoomend', syncZoomLevel)
    syncZoomLevel()

    return () => {
      map.off('zoomend', syncZoomLevel)
    }
  }, [map])

  const minZoom = map.getMinZoom()
  const maxZoom = map.getMaxZoom()
  const canZoomOut = Number.isFinite(minZoom) ? zoomLevel > minZoom : true
  const canZoomIn = Number.isFinite(maxZoom) ? zoomLevel < maxZoom : true

  return (
    <div
      className="absolute right-4 bottom-[calc(var(--app-bottom-offset)+env(safe-area-inset-bottom)+96px)] z-[1002] flex flex-col gap-2.5 lg:right-7 lg:bottom-[124px]"
      role="group"
      aria-label="Map zoom controls"
    >
      <button
        type="button"
        className="inline-flex h-[54px] w-[54px] items-center justify-center rounded-[18px] border border-white/14 bg-[linear-gradient(180deg,rgba(13,19,38,0.96),rgba(8,14,30,0.92)),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))] text-[rgba(244,253,255,0.96)] shadow-[0_22px_44px_rgba(2,10,23,0.38),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-[18px] transition hover:-translate-y-px hover:border-[rgba(255,210,166,0.38)] hover:text-white hover:shadow-[0_26px_50px_rgba(2,10,23,0.42),0_0_0_1px_rgba(255,255,255,0.05)_inset] active:scale-[0.97] disabled:cursor-not-allowed disabled:border-white/8 disabled:text-slate-300/40 disabled:shadow-[0_18px_36px_rgba(2,10,23,0.24),0_0_0_1px_rgba(255,255,255,0.02)_inset] lg:h-14 lg:w-14 lg:rounded-[20px]"
        onClick={() => map.zoomIn()}
        disabled={!canZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
      >
        <ZoomInIcon />
      </button>
      <button
        type="button"
        className="inline-flex h-[54px] w-[54px] items-center justify-center rounded-[18px] border border-white/14 bg-[linear-gradient(180deg,rgba(13,19,38,0.96),rgba(8,14,30,0.92)),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0))] text-[rgba(244,253,255,0.96)] shadow-[0_22px_44px_rgba(2,10,23,0.38),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-[18px] transition hover:-translate-y-px hover:border-[rgba(255,210,166,0.38)] hover:text-white hover:shadow-[0_26px_50px_rgba(2,10,23,0.42),0_0_0_1px_rgba(255,255,255,0.05)_inset] active:scale-[0.97] disabled:cursor-not-allowed disabled:border-white/8 disabled:text-slate-300/40 disabled:shadow-[0_18px_36px_rgba(2,10,23,0.24),0_0_0_1px_rgba(255,255,255,0.02)_inset] lg:h-14 lg:w-14 lg:rounded-[20px]"
        onClick={() => map.zoomOut()}
        disabled={!canZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
      >
        <ZoomOutIcon />
      </button>
    </div>
  )
}
