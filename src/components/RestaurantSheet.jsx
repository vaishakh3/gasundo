'use client'

import { useEffect, useState } from 'react'

import { Sheet } from 'react-modal-sheet'

import RestaurantDetailCard from './RestaurantDetailCard'

export default function RestaurantSheet({
  restaurant,
  statusData,
  onClose,
  onStatusUpdate,
  onConfirm,
  onNotice,
}) {
  const [isMobileViewport, setIsMobileViewport] = useState(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const syncViewport = () => {
      setIsMobileViewport(mediaQuery.matches)
    }

    syncViewport()
    mediaQuery.addEventListener('change', syncViewport)

    return () => mediaQuery.removeEventListener('change', syncViewport)
  }, [])

  if (!restaurant || isMobileViewport !== true) return null

  return (
    <div>
      <Sheet
        isOpen={!!restaurant}
        onClose={onClose}
        snapPoints={[0, 140, 1]}
        initialSnap={1}
      >
        <Sheet.Container
          style={{
            background:
              'linear-gradient(180deg, rgba(12,18,36,0.98), rgba(6,11,24,0.98))',
            borderRadius: '30px 30px 0 0',
            boxShadow: '0 -20px 60px rgba(5,8,22,0.45)',
          }}
        >
          <Sheet.Header />
          <Sheet.Content>
            <div className="px-3 pb-[max(24px,env(safe-area-inset-bottom))]">
              <RestaurantDetailCard
                restaurant={restaurant}
                statusData={statusData}
                onStatusUpdate={onStatusUpdate}
                onConfirm={onConfirm}
                onNotice={onNotice}
                stickyHeader
              />
            </div>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={onClose} />
      </Sheet>
    </div>
  )
}
