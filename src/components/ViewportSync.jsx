'use client'

import { useEffect } from 'react'

function applyViewportMetrics() {
  const root = document.documentElement
  const viewport = window.visualViewport
  const height = viewport?.height ?? window.innerHeight
  const width = viewport?.width ?? window.innerWidth
  const offsetTop = viewport?.offsetTop ?? 0
  const bottomOffset = Math.max(
    0,
    window.innerHeight - height - offsetTop
  )

  root.style.setProperty('--app-vh', `${height}px`)
  root.style.setProperty('--app-vw', `${width}px`)
  root.style.setProperty('--app-top-offset', `${offsetTop}px`)
  root.style.setProperty('--app-bottom-offset', `${bottomOffset}px`)
}

export default function ViewportSync() {
  useEffect(() => {
    let frameId = 0

    const scheduleSync = () => {
      if (frameId) {
        return
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0
        applyViewportMetrics()
      })
    }

    applyViewportMetrics()

    const viewport = window.visualViewport

    window.addEventListener('resize', scheduleSync)
    window.addEventListener('orientationchange', scheduleSync)
    viewport?.addEventListener('resize', scheduleSync)
    viewport?.addEventListener('scroll', scheduleSync)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      window.removeEventListener('resize', scheduleSync)
      window.removeEventListener('orientationchange', scheduleSync)
      viewport?.removeEventListener('resize', scheduleSync)
      viewport?.removeEventListener('scroll', scheduleSync)
    }
  }, [])

  return null
}
