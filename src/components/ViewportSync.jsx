'use client'

import { useEffect } from 'react'

const KEYBOARD_OFFSET_THRESHOLD = 160
const KEYBOARD_OFFSET_RATIO = 0.22

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
  const keyboardOpen =
    bottomOffset >
    Math.max(KEYBOARD_OFFSET_THRESHOLD, window.innerHeight * KEYBOARD_OFFSET_RATIO)
  const floatingBottomOffset = keyboardOpen ? 0 : bottomOffset

  root.style.setProperty('--app-vh', `${height}px`)
  root.style.setProperty('--app-vw', `${width}px`)
  root.style.setProperty('--app-top-offset', `${offsetTop}px`)
  root.style.setProperty('--app-bottom-offset', `${bottomOffset}px`)
  root.style.setProperty(
    '--app-floating-bottom-offset',
    `${floatingBottomOffset}px`
  )
  root.dataset.keyboardOpen = keyboardOpen ? 'true' : 'false'
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
