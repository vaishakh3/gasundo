'use client'

import dynamic from 'next/dynamic'
import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react'

import FilterBar from '@/components/FilterBar'
import RestaurantPanel from '@/components/RestaurantPanel'
import RestaurantSheet from '@/components/RestaurantSheet'
import { buildStatusKey } from '@/lib/status-key'
import {
  compareRestaurantRecords,
  getRestaurantDisplayData,
  getStatusSummary,
} from '@/lib/status-ui'
import { confirmStatus, updateStatus } from '@/services/statusService'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-container bg-[var(--ink-950)]" />,
})

export default function HomeClient({
  initialRestaurants,
  initialStatusMap,
  initialError,
}) {
  const [restaurants] = useState(initialRestaurants)
  const [statusMap, setStatusMap] = useState(initialStatusMap)
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [filter, setFilter] = useState({ search: '', statusFilter: 'all' })
  const [notice, setNotice] = useState(() =>
    initialError ? { tone: 'error', message: initialError, id: 'initial-error' } : null
  )
  const [isPending, startFilterTransition] = useTransition()
  const deferredSearch = useDeferredValue(filter.search.trim().toLowerCase())

  useEffect(() => {
    if (!notice?.id) return undefined

    const timeoutId = window.setTimeout(() => {
      setNotice((currentNotice) =>
        currentNotice?.id === notice.id ? null : currentNotice
      )
    }, 3600)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  const restaurantRecords = useMemo(() => {
    return restaurants.map((restaurant) => ({
      restaurant,
      ...getRestaurantDisplayData(restaurant, statusMap),
    }))
  }, [restaurants, statusMap])

  const summaryCounts = useMemo(() => {
    return getStatusSummary(restaurants, statusMap)
  }, [restaurants, statusMap])

  const filteredRecords = useMemo(() => {
    return restaurantRecords
      .filter((record) => {
        if (deferredSearch) {
          const haystack = `${record.restaurant.name} ${record.restaurant.brand || ''}`
          if (!haystack.toLowerCase().includes(deferredSearch)) {
            return false
          }
        }

        if (
          filter.statusFilter !== 'all' &&
          record.status !== filter.statusFilter
        ) {
          return false
        }

        return true
      })
      .sort(compareRestaurantRecords)
  }, [restaurantRecords, deferredSearch, filter.statusFilter])

  const selectedRecord = useMemo(() => {
    if (!selectedRestaurant) return null

    return (
      restaurantRecords.find(
        (record) => record.restaurant.id === selectedRestaurant.id
      ) || null
    )
  }, [restaurantRecords, selectedRestaurant])

  const showNotice = (message, tone = 'neutral') => {
    setNotice({
      id: Date.now(),
      message,
      tone,
    })
  }

  const handleFilterChange = (nextFilter) => {
    startFilterTransition(() => {
      setFilter(nextFilter)
    })
  }

  const handleSelectRestaurant = (restaurant) => {
    setSelectedRestaurant(restaurant)
  }

  const visibleRestaurants = useMemo(() => {
    const restaurantsFromFilters = filteredRecords.map((record) => record.restaurant)

    if (
      selectedRestaurant &&
      !restaurantsFromFilters.some(
        (restaurant) => restaurant.id === selectedRestaurant.id
      )
    ) {
      return [...restaurantsFromFilters, selectedRestaurant]
    }

    return restaurantsFromFilters
  }, [filteredRecords, selectedRestaurant])

  const handleStatusUpdate = async (updateData) => {
    const result = await updateStatus(updateData)
    const key = buildStatusKey(result.lat, result.lng)

    setStatusMap((previous) => ({
      ...previous,
      [key]: result,
    }))

    return result
  }

  const handleConfirm = async (statusId) => {
    const result = await confirmStatus(statusId)
    const key = buildStatusKey(result.lat, result.lng)

    setStatusMap((previous) => ({
      ...previous,
      [key]: result,
    }))

    return result
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="relative min-h-screen lg:flex">
        <RestaurantPanel
          filter={filter}
          onFilterChange={handleFilterChange}
          restaurants={restaurants}
          restaurantRecords={filteredRecords}
          totalCount={restaurants.length}
          resultCount={filteredRecords.length}
          summaryCounts={summaryCounts}
          selectedRestaurant={selectedRestaurant}
          selectedStatusData={selectedRecord?.statusData || null}
          onSelectRestaurant={handleSelectRestaurant}
          onClearSelection={() => setSelectedRestaurant(null)}
          onStatusUpdate={handleStatusUpdate}
          onConfirm={handleConfirm}
          onNotice={showNotice}
          notice={notice}
          isPending={isPending}
        />

        <div className="relative min-h-screen flex-1 overflow-hidden">
          <div className="absolute inset-0">
            <MapView
              restaurants={visibleRestaurants}
              statusMap={statusMap}
              onSelectRestaurant={handleSelectRestaurant}
              selectedRestaurant={selectedRestaurant}
              onLocateError={(message) => showNotice(message, 'error')}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,69,0.2),transparent_22%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.08),transparent_18%),linear-gradient(180deg,rgba(6,10,22,0.42),transparent_26%,rgba(6,10,22,0.25))]" />

          <FilterBar
            onFilterChange={handleFilterChange}
            filter={filter}
            restaurants={restaurants}
            onSelect={handleSelectRestaurant}
            resultCount={filteredRecords.length}
            totalCount={restaurants.length}
            summaryCounts={summaryCounts}
            notice={notice}
            isPending={isPending}
            variant="mobile"
          />

          <RestaurantSheet
            restaurant={selectedRestaurant}
            statusData={selectedRecord?.statusData || null}
            onClose={() => setSelectedRestaurant(null)}
            onStatusUpdate={handleStatusUpdate}
            onConfirm={handleConfirm}
            onNotice={showNotice}
          />
        </div>
      </div>

    </div>
  )
}
