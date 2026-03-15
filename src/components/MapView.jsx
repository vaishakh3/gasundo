'use client'

import { useEffect, useRef, useState } from 'react'

import { DEFAULT_MAP_ZOOM, KOCHI_BOUNDS, KOCHI_CENTER } from '@/lib/constants'
import { getStatusMeta } from '@/lib/status-ui'
import {
  loadGoogleMapsApi,
  loadMarkerClusterer,
} from '@/lib/google-maps-client'

import LocateButton from './LocateButton'
import ZoomControl from './ZoomControl'

const brandLogos = {
  "McDonald's": '/logos/mcdonalds.png',
  KFC: '/logos/kfc.png',
  'Burger King': '/logos/burgerking.png',
  Subway: '/logos/subway.png',
  "Domino's": '/logos/dominos.png',
  'Pizza Hut': '/logos/pizzahut.png',
  Starbucks: '/logos/starbucks.png',
}

const STATUS_RING_COLORS = {
  open: '#22c55e',
  limited: '#eab308',
  closed: '#ef4444',
  unknown: '#6b7280',
}

function createMarkerNode(restaurant, status, isSelected) {
  const ringColor = STATUS_RING_COLORS[status] || STATUS_RING_COLORS.unknown
  const hasBrand = restaurant.brand && brandLogos[restaurant.brand]
  const iconUrl = hasBrand ? brandLogos[restaurant.brand] : '/default-marker.png'
  const isUnknown = status === 'unknown'
  const size = isSelected ? 56 : 42
  const imageSize = isSelected ? 31 : 26
  const borderWidth = isSelected ? 4 : 3
  const background = 'rgba(247, 250, 252, 0.98)'
  const wrapper = document.createElement('button')
  wrapper.type = 'button'
  wrapper.className = 'custom-google-marker'
  wrapper.setAttribute('aria-label', `${restaurant.name}: ${getStatusMeta(status).label}`)
  wrapper.innerHTML = `
    <span class="custom-google-marker__ring" style="
      width:${size}px;
      height:${size}px;
      border:${borderWidth}px solid ${ringColor};
      background:${background};
      box-shadow:${
        isSelected
          ? '0 0 0 8px rgba(255,122,69,0.18), 0 20px 44px rgba(5,8,22,0.36)'
          : '0 12px 26px rgba(5,8,22,0.24)'
      };
    ">
      <img src="${iconUrl}" alt="" aria-hidden="true" style="width:${imageSize}px;height:${imageSize}px;border-radius:50%;object-fit:cover;${isUnknown ? 'opacity:0.88;filter:saturate(0) contrast(0.92);' : ''}" />
    </span>
  `

  return wrapper
}

function createUserMarkerNode() {
  const wrapper = document.createElement('div')
  wrapper.className = 'user-location-marker'
  return wrapper
}

function normalizeMapBounds(googleMaps, bounds) {
  return new googleMaps.LatLngBounds(
    { lat: bounds.minLat, lng: bounds.minLng },
    { lat: bounds.maxLat, lng: bounds.maxLng }
  )
}

function createClusterRenderer(googleMaps) {
  return {
    render({ count, position }) {
      const size = count >= 50 ? 62 : count >= 20 ? 56 : 50
      const element = document.createElement('div')
      element.className = 'custom-google-cluster'
      element.setAttribute('aria-label', `${count} restaurants in this cluster`)
      element.innerHTML = `
        <span class="custom-google-cluster__core" style="
          width:${size}px;
          height:${size}px;
          box-shadow:0 14px 30px rgba(2,10,23,0.22);
        ">
          ${count}
        </span>
      `

      return new googleMaps.marker.AdvancedMarkerElement({
        position,
        content: element,
        zIndex: Number(googleMaps.Marker.MAX_ZINDEX) + count,
      })
    },
  }
}

export default function MapView({
  restaurantIds,
  restaurantsById,
  statusMap,
  onSelectRestaurant,
  onImportPlace,
  onNotice,
  selectedRestaurant,
  selectedRestaurantId,
  onLocateError,
}) {
  const mapElementRef = useRef(null)
  const mapRef = useRef(null)
  const googleMapsRef = useRef(null)
  const advancedMarkerRef = useRef(null)
  const markerClusterRef = useRef(null)
  const markersByIdRef = useRef(new Map())
  const userMarkerRef = useRef(null)
  const userAccuracyCircleRef = useRef(null)
  const [mapReady, setMapReady] = useState(false)
  const [zoomState, setZoomState] = useState({
    current: DEFAULT_MAP_ZOOM,
    min: 3,
    max: 20,
  })

  const publicApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const publicMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'

  useMapEffects({
    mapElementRef,
    mapRef,
    googleMapsRef,
    advancedMarkerRef,
    markerClusterRef,
    markersByIdRef,
    restaurantIds,
    restaurantsById,
    statusMap,
    onSelectRestaurant,
    onImportPlace,
    onNotice,
    selectedRestaurant,
    selectedRestaurantId,
    publicApiKey,
    publicMapId,
    mapReady,
    setMapReady,
    setZoomState,
  })

  return (
    <div className="relative">
      <div ref={mapElementRef} className="map-container" />
      {publicApiKey ? null : (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[rgba(6,11,24,0.92)] px-6 text-center text-sm text-[var(--text-secondary)]">
          Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to load the Google map.
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-[1001]">
        <ZoomControl
          canZoomIn={zoomState.current < zoomState.max}
          canZoomOut={zoomState.current > zoomState.min}
          onZoomIn={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
          onZoomOut={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
        />
        <LocateButton onLocate={handleLocate} onError={onLocateError} />
      </div>
    </div>
  )

  async function handleLocate() {
    const map = mapRef.current
    const googleMaps = googleMapsRef.current
    const AdvancedMarkerElement = advancedMarkerRef.current

    if (!map || !googleMaps || !AdvancedMarkerElement) {
      throw new Error('Map is not ready yet.')
    }

    const position = await new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported in this browser.'))
        return
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      })
    })

    const latLng = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.map = null
    }

    userMarkerRef.current = new AdvancedMarkerElement({
      map,
      position: latLng,
      content: createUserMarkerNode(),
      title: 'Your location',
      zIndex: 3000,
    })

    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setMap(null)
    }

    userAccuracyCircleRef.current = new googleMaps.Circle({
      map,
      center: latLng,
      radius: Math.max(position.coords.accuracy / 2, 25),
      fillColor: '#3b82f6',
      fillOpacity: 0.12,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.8,
      strokeWeight: 1,
    })

    map.panTo(latLng)
    map.setZoom(Math.max(map.getZoom() || DEFAULT_MAP_ZOOM, 15))
  }
}

function useMapEffects({
  mapElementRef,
  mapRef,
  googleMapsRef,
  advancedMarkerRef,
  markerClusterRef,
  markersByIdRef,
  restaurantIds,
  restaurantsById,
  statusMap,
  onSelectRestaurant,
  onImportPlace,
  onNotice,
  selectedRestaurant,
  selectedRestaurantId,
  publicApiKey,
  publicMapId,
  mapReady,
  setMapReady,
  setZoomState,
}) {
  useEffect(() => {
    if (!mapElementRef.current || !publicApiKey) {
      return
    }

    let cancelled = false
    let listeners = []
    const currentMarkers = markersByIdRef.current
    let importingPlace = false

    async function initializeMap() {
      const [googleMaps, clustererModule] = await Promise.all([
        loadGoogleMapsApi(publicApiKey),
        loadMarkerClusterer(),
      ])
      const { Map } = await googleMaps.importLibrary('maps')
      const { AdvancedMarkerElement } = await googleMaps.importLibrary('marker')

      if (cancelled) {
        return
      }

      googleMapsRef.current = googleMaps
      advancedMarkerRef.current = AdvancedMarkerElement

      const restrictedBounds = normalizeMapBounds(googleMaps, KOCHI_BOUNDS)
      const map = new Map(mapElementRef.current, {
        center: { lat: KOCHI_CENTER[0], lng: KOCHI_CENTER[1] },
        zoom: DEFAULT_MAP_ZOOM,
        mapId: publicMapId,
        disableDefaultUI: true,
        clickableIcons: true,
        gestureHandling: 'greedy',
        minZoom: 10,
        maxZoom: 20,
        restriction: {
          latLngBounds: restrictedBounds,
          strictBounds: false,
        },
      })

      mapRef.current = map

      const syncZoomState = () => {
        setZoomState({
          current: map.getZoom() || DEFAULT_MAP_ZOOM,
          min: 10,
          max: 20,
        })
      }

      listeners = [
        map.addListener('zoom_changed', syncZoomState),
        map.addListener('idle', syncZoomState),
        map.addListener('click', async (event) => {
          const placeId = typeof event.placeId === 'string' ? event.placeId.trim() : ''

          if (!placeId || importingPlace) {
            return
          }

          event.stop?.()
          importingPlace = true

          try {
            const importedRestaurant = await onImportPlace?.(placeId)

            if (!importedRestaurant) {
              throw new Error('Could not import this Google Maps place.')
            }
          } catch (error) {
            console.error('Failed to import the clicked Google Maps place:', error)
            onNotice?.(
              error instanceof Error
                ? error.message
                : 'Could not import this place right now.',
              'error'
            )
          } finally {
            importingPlace = false
          }
        }),
      ]

      syncZoomState()

      markerClusterRef.current = new clustererModule.MarkerClusterer({
        map,
        markers: [],
        renderer: createClusterRenderer(googleMaps),
      })

      setMapReady(true)
    }

    initializeMap().catch((error) => {
      console.error('Failed to initialize Google Maps:', error)
    })

    return () => {
      cancelled = true

      for (const listener of listeners) {
        listener.remove()
      }

      if (markerClusterRef.current) {
        markerClusterRef.current.clearMarkers()
        markerClusterRef.current = null
      }

      for (const marker of currentMarkers.values()) {
        marker.map = null
      }

      currentMarkers.clear()

      if (mapRef.current) {
        googleMapsRef.current?.event?.clearInstanceListeners(mapRef.current)
      }

      mapRef.current = null
      advancedMarkerRef.current = null
      googleMapsRef.current = null
      setMapReady(false)
    }
  }, [
    advancedMarkerRef,
    googleMapsRef,
    mapElementRef,
    mapRef,
    markerClusterRef,
    markersByIdRef,
    onImportPlace,
    onNotice,
    publicApiKey,
    publicMapId,
    setMapReady,
    setZoomState,
  ])

  useEffect(() => {
    if (!mapReady || !mapRef.current || !advancedMarkerRef.current) {
      return
    }

    const markers = []

    for (const marker of markersByIdRef.current.values()) {
      marker.map = null
    }

    markersByIdRef.current.clear()

    for (const restaurantId of restaurantIds) {
      const restaurant = restaurantsById[restaurantId]

      if (!restaurant) {
        continue
      }

      const status = statusMap[restaurant.restaurant_key]?.status || 'unknown'
      const marker = new advancedMarkerRef.current({
        position: {
          lat: restaurant.lat,
          lng: restaurant.lng,
        },
        title: `${restaurant.name}: ${getStatusMeta(status).label}`,
        content: createMarkerNode(
          restaurant,
          status,
          selectedRestaurantId === restaurant.restaurant_key
        ),
        zIndex: selectedRestaurantId === restaurant.restaurant_key ? 2000 : 1000,
      })

      marker.__gasundoStatus = status
      marker.addListener('gmp-click', () => onSelectRestaurant(restaurant))
      markersByIdRef.current.set(restaurant.restaurant_key, marker)
      markers.push(marker)
    }

    markerClusterRef.current?.clearMarkers()
    markerClusterRef.current?.addMarkers(markers)
  }, [
    mapReady,
    advancedMarkerRef,
    mapRef,
    markerClusterRef,
    markersByIdRef,
    onSelectRestaurant,
    onImportPlace,
    onNotice,
    restaurantIds,
    restaurantsById,
    selectedRestaurantId,
    statusMap,
  ])

  useEffect(() => {
    if (!mapRef.current || !selectedRestaurant) {
      return
    }

    mapRef.current.panTo({
      lat: selectedRestaurant.lat,
      lng: selectedRestaurant.lng,
    })
    mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || DEFAULT_MAP_ZOOM, 16))
  }, [mapRef, selectedRestaurant])
}
