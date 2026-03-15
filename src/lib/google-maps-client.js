'use client'

const MARKER_CLUSTERER_SRC =
  'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js'

let googleMapsPromise = null
let markerClustererPromise = null

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}"]`)

    if (existingScript) {
      if (existingScript.dataset.loaded === 'true') {
        resolve(existingScript)
        return
      }

      existingScript.addEventListener('load', () => resolve(existingScript), {
        once: true,
      })
      existingScript.addEventListener(
        'error',
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true

    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true'
        resolve(script)
      },
      { once: true }
    )
    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load script: ${src}`)),
      { once: true }
    )

    document.head.appendChild(script)
  })
}

function bootstrapGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) {
      resolve(window.google.maps)
      return
    }

    const google = (window.google ||= {})
    const maps = (google.maps ||= {})

    if (maps.__codexLoaderPromise) {
      maps.__codexLoaderPromise.then(() => resolve(window.google.maps)).catch(reject)
      return
    }

    let script = document.querySelector('script[data-google-maps-bootstrap="true"]')

    maps.__codexLoaderPromise = new Promise((loaderResolve, loaderReject) => {
      const callbackName = '__googleMapsCallback'

      window[callbackName] = () => {
        delete window[callbackName]
        script?.setAttribute('data-loaded', 'true')
        loaderResolve()
      }

      if (!script) {
        script = document.createElement('script')
        script.async = true
        script.defer = true
        script.setAttribute('data-google-maps-bootstrap', 'true')

        const params = new URLSearchParams({
          key: apiKey,
          v: 'weekly',
          loading: 'async',
          callback: callbackName,
        })

        script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
        script.onerror = () => {
          delete window[callbackName]
          loaderReject(new Error('Failed to load the Google Maps JavaScript API.'))
        }

        document.head.appendChild(script)
      }
    })

    maps.__codexLoaderPromise
      .then(() => {
        if (!window.google?.maps?.importLibrary) {
          throw new Error(
            'Google Maps loaded, but importLibrary is unavailable. Check that Maps JavaScript API is enabled for this key.'
          )
        }

        resolve(window.google.maps)
      })
      .catch(reject)
  })
}

export async function loadGoogleMapsApi(apiKey) {
  if (!apiKey) {
    throw new Error('Missing Google Maps API key.')
  }

  if (typeof window === 'undefined') {
    throw new Error('Google Maps can only load in the browser.')
  }

  if (!googleMapsPromise) {
    googleMapsPromise = bootstrapGoogleMaps(apiKey)
  }

  return googleMapsPromise
}

export async function loadMarkerClusterer() {
  if (typeof window === 'undefined') {
    throw new Error('MarkerClusterer can only load in the browser.')
  }

  if (window.markerClusterer?.MarkerClusterer) {
    return window.markerClusterer
  }

  if (!markerClustererPromise) {
    markerClustererPromise = loadScript(MARKER_CLUSTERER_SRC).then(() => {
      if (!window.markerClusterer?.MarkerClusterer) {
        throw new Error('MarkerClusterer failed to initialize.')
      }

      return window.markerClusterer
    })
  }

  return markerClustererPromise
}
