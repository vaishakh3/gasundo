'use client'

import { useEffect, useMemo, useState } from 'react'

import { formatTimeAgo, isTimestampStale } from '@/lib/time-ago'

export default function useTimeAgo(dateString) {
  const [now, setNow] = useState(null)

  useEffect(() => {
    if (!dateString) {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => {
      setNow(Date.now())
    })

    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 30000)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearInterval(interval)
    }
  }, [dateString])

  const text = useMemo(
    () => (dateString ? formatTimeAgo(dateString, now) : ''),
    [dateString, now]
  )

  const isStale = isTimestampStale(dateString, now)

  return { text, isStale }
}
