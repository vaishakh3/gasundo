import { useState, useEffect, useMemo } from 'react'
import MapView from '../components/MapView'
import RestaurantSheet from '../components/RestaurantSheet'
import FilterBar from '../components/FilterBar'
import { fetchRestaurants } from '../services/restaurantService'
import { getLatestStatuses, updateStatus, confirmStatus } from '../services/statusService'

export default function Home() {
  const [restaurants, setRestaurants] = useState([])
  const [statusMap, setStatusMap] = useState({})
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState({ search: '', statusFilter: 'all' })

  useEffect(() => {
    async function loadData() {
      try {
        const [restaurantData, statuses] = await Promise.all([
          fetchRestaurants(),
          getLatestStatuses(),
        ])
        setRestaurants(restaurantData)
        setStatusMap(statuses)
      } catch (err) {
        console.error('Failed to load data:', err)
        setError('Failed to load restaurants. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      // Name search
      if (filter.search) {
        const q = filter.search.toLowerCase()
        if (!r.name.toLowerCase().includes(q)) return false
      }

      // Status filter
      if (filter.statusFilter !== 'all') {
        const key = `${r.lat.toFixed(5)}_${r.lng.toFixed(5)}`
        const status = statusMap[key]?.status || 'unknown'
        if (status !== filter.statusFilter) return false
      }

      return true
    })
  }, [restaurants, statusMap, filter])

  const handleStatusUpdate = async (updateData) => {
    const result = await updateStatus(updateData)
    if (result) {
      const key = `${updateData.lat.toFixed(5)}_${updateData.lng.toFixed(5)}`
      setStatusMap((prev) => ({
        ...prev,
        [key]: result,
      }))
    }
  }

  const handleConfirm = async (statusId) => {
    const result = await confirmStatus(statusId)
    if (result) {
      // Update the local status map with incremented confirmations
      setStatusMap((prev) => {
        const updated = { ...prev }
        for (const key in updated) {
          if (updated[key].id === statusId) {
            updated[key] = { ...updated[key], confirmations: (updated[key].confirmations || 0) + 1 }
            break
          }
        }
        return updated
      })
    }
  }

  const selectedKey = selectedRestaurant
    ? `${selectedRestaurant.lat.toFixed(5)}_${selectedRestaurant.lng.toFixed(5)}`
    : null

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-gradient-to-b from-[#1a1a2e] via-[#1a1a2e]/80 to-transparent pointer-events-none pb-4">
        <div className="px-4 pt-3 pb-8 pointer-events-auto">
          <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
            🔥 GasUndo Kochi
          </h1>
          <p className="text-white/90 font-medium text-xs mt-0.5 drop-shadow-md">
            Live map of restaurants affected by LPG shortage
          </p>
        </div>
      </header>

      {/* Filter Bar */}
      {!loading && (
        <FilterBar filter={filter} onFilterChange={setFilter} restaurants={restaurants} />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-[#1a1a2e]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="text-white/50 text-sm">Loading restaurants...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-16 left-4 right-4 z-[999] bg-red-500/20 text-red-300 text-sm px-4 py-3 rounded-xl text-center">
          {error}
        </div>
      )}

      {/* Map */}
      <MapView
        restaurants={filteredRestaurants}
        statusMap={statusMap}
        onSelectRestaurant={setSelectedRestaurant}
      />

      {/* Restaurant count badge */}
      {!loading && restaurants.length > 0 && (
        <div className="absolute bottom-6 left-4 z-[999] bg-[#1a1a2e]/90 backdrop-blur-sm text-white/60 text-xs px-3 py-1.5 rounded-full">
          {filteredRestaurants.length === restaurants.length
            ? `${restaurants.length} restaurants`
            : `${filteredRestaurants.length} of ${restaurants.length} restaurants`
          }
        </div>
      )}

      {/* Bottom Sheet */}
      <RestaurantSheet
        restaurant={selectedRestaurant}
        statusData={selectedKey ? statusMap[selectedKey] : null}
        onClose={() => setSelectedRestaurant(null)}
        onStatusUpdate={handleStatusUpdate}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
