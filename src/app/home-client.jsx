'use client'

import dynamic from 'next/dynamic'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'

import { useAuth } from '@/components/AuthProvider'
import FilterBar from '@/components/FilterBar'
import RestaurantPanel from '@/components/RestaurantPanel'
import RestaurantSheet from '@/components/RestaurantSheet'
import {
  buildCatalogIndex,
  selectMapRestaurantIds,
  selectSelectedRecord,
  selectSuggestions,
  selectSummaryCounts,
  selectVisibleRestaurantIds,
} from '@/lib/catalog-query'
import {
  CATALOG_QUERY_KEY,
  getStatusSnapshotQueryKey,
} from '@/lib/query-keys'
import { useQueryStore } from '@/store/query-store'
import { fetchCatalog, importCatalogPlace } from '@/services/catalogService'
import { fetchStatusSnapshot } from '@/services/statusSnapshotService'
import {
  confirmStatus as confirmStatusRequest,
  updateStatus as updateStatusRequest,
} from '@/services/statusService'

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <div className="map-container bg-[var(--ink-950)]" />,
})

const EMPTY_STATUS_SNAPSHOT = {
  generatedAt: null,
  snapshotVersion: 'initial',
  statuses: {},
}

function mergeStatusIntoSnapshot(snapshot, status) {
  return {
    generatedAt: new Date().toISOString(),
    snapshotVersion: snapshot?.snapshotVersion || 'local',
    statuses: {
      ...(snapshot?.statuses || {}),
      [status.restaurant_key]: status,
    },
  }
}

function mergeRestaurantIntoCatalog(catalog, restaurant) {
  const currentCatalog = catalog || {
    catalogVersion: 'local',
    restaurants: [],
  }
  const restaurants = Array.isArray(currentCatalog.restaurants)
    ? currentCatalog.restaurants
    : []
  const existingIndex = restaurants.findIndex(
    (entry) => entry.restaurant_key === restaurant.restaurant_key
  )
  const nextRestaurants =
    existingIndex === -1
      ? [...restaurants, restaurant].sort((left, right) =>
          left.name.localeCompare(right.name)
        )
      : restaurants.map((entry, index) =>
          index === existingIndex ? restaurant : entry
        )

  return {
    ...currentCatalog,
    restaurants: nextRestaurants,
  }
}

export default function HomeClient({ initialRestaurants, initialError }) {
  const queryClient = useQueryClient()
  const hasHydratedSharedRestaurantRef = useRef(false)
  const { viewer, isReady: authReady } = useAuth()
  const search = useQueryStore((state) => state.search)
  const statusFilter = useQueryStore((state) => state.statusFilter)
  const selectedRestaurantId = useQueryStore(
    (state) => state.selectedRestaurantId
  )
  const setSearch = useQueryStore((state) => state.setSearch)
  const clearSearch = useQueryStore((state) => state.clearSearch)
  const setStatusFilter = useQueryStore((state) => state.setStatusFilter)
  const setSelectedRestaurantId = useQueryStore(
    (state) => state.setSelectedRestaurantId
  )
  const clearSelectedRestaurant = useQueryStore(
    (state) => state.clearSelectedRestaurant
  )
  const [notice, setNotice] = useState(() =>
    initialError ? { tone: 'error', message: initialError, id: 'initial-error' } : null
  )
  const deferredSearch = useDeferredValue(search)
  const viewerScope = viewer?.userId || 'guest'
  const statusSnapshotQueryKey = useMemo(
    () => getStatusSnapshotQueryKey(viewerScope),
    [viewerScope]
  )
  const showNotice = (message, tone = 'neutral') => {
    setNotice({
      id: Date.now(),
      message,
      tone,
    })
  }

  const catalogQuery = useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: fetchCatalog,
    initialData: {
      catalogVersion: 'server-rendered',
      restaurants: initialRestaurants,
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  })

  const statusSnapshotQuery = useQuery({
    queryKey: statusSnapshotQueryKey,
    queryFn: fetchStatusSnapshot,
    initialData: EMPTY_STATUS_SNAPSHOT,
    enabled: authReady,
    staleTime: 30 * 1000,
  })

  useEffect(() => {
    if (!notice?.id) return undefined

    const timeoutId = window.setTimeout(() => {
      setNotice((currentNotice) =>
        currentNotice?.id === notice.id ? null : currentNotice
      )
    }, 3600)

    return () => window.clearTimeout(timeoutId)
  }, [notice])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const currentUrl = new URL(window.location.href)
    const authError = currentUrl.searchParams.get('authError')

    if (!authError) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      showNotice(authError, 'error')
    })
    currentUrl.searchParams.delete('authError')
    window.history.replaceState({}, '', currentUrl)
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  const restaurants = useMemo(
    () => catalogQuery.data?.restaurants || [],
    [catalogQuery.data]
  )
  const statusSnapshot = statusSnapshotQuery.data || EMPTY_STATUS_SNAPSHOT
  const statusMap = useMemo(
    () => statusSnapshot.statuses || EMPTY_STATUS_SNAPSHOT.statuses,
    [statusSnapshot]
  )

  const catalogIndex = useMemo(
    () => buildCatalogIndex(restaurants),
    [restaurants]
  )

  useEffect(() => {
    if (
      selectedRestaurantId &&
      !catalogIndex.restaurantById[selectedRestaurantId]
    ) {
      clearSelectedRestaurant()
    }
  }, [catalogIndex, clearSelectedRestaurant, selectedRestaurantId])

  useEffect(() => {
    if (
      hasHydratedSharedRestaurantRef.current ||
      typeof window === 'undefined'
    ) {
      return
    }

    const sharedRestaurantId = new URL(window.location.href).searchParams.get(
      'restaurant'
    )

    if (!sharedRestaurantId) {
      hasHydratedSharedRestaurantRef.current = true
      return
    }

    if (catalogIndex.restaurantById[sharedRestaurantId]) {
      setSelectedRestaurantId(sharedRestaurantId)
      hasHydratedSharedRestaurantRef.current = true
      return
    }

    if (catalogIndex.restaurantIds.length > 0) {
      hasHydratedSharedRestaurantRef.current = true
    }
  }, [catalogIndex, setSelectedRestaurantId])

  useEffect(() => {
    if (typeof document === 'undefined' || !authReady) {
      return undefined
    }

    const refreshSnapshot = () => {
      if (document.visibilityState !== 'visible') {
        return
      }

      queryClient.invalidateQueries({ queryKey: statusSnapshotQueryKey })
    }

    document.addEventListener('visibilitychange', refreshSnapshot)
    return () => document.removeEventListener('visibilitychange', refreshSnapshot)
  }, [authReady, queryClient, statusSnapshotQueryKey])

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !hasHydratedSharedRestaurantRef.current
    ) {
      return
    }

    const currentUrl = new URL(window.location.href)

    if (selectedRestaurantId) {
      currentUrl.searchParams.set('restaurant', selectedRestaurantId)
    } else {
      currentUrl.searchParams.delete('restaurant')
    }

    window.history.replaceState({}, '', currentUrl)
  }, [selectedRestaurantId])

  const queryState = useMemo(
    () => ({
      search: deferredSearch,
      statusFilter,
      selectedRestaurantId,
    }),
    [deferredSearch, selectedRestaurantId, statusFilter]
  )

  const summaryCounts = useMemo(
    () => selectSummaryCounts(catalogIndex, statusMap),
    [catalogIndex, statusMap]
  )

  const suggestions = useMemo(
    () => selectSuggestions(catalogIndex, search),
    [catalogIndex, search]
  )

  const visibleRestaurantIds = useMemo(
    () => selectVisibleRestaurantIds(catalogIndex, statusMap, queryState),
    [catalogIndex, queryState, statusMap]
  )

  const selectedRecord = useMemo(
    () =>
      selectSelectedRecord(catalogIndex, statusMap, selectedRestaurantId),
    [catalogIndex, selectedRestaurantId, statusMap]
  )

  const mapRestaurantIds = useMemo(
    () => selectMapRestaurantIds(visibleRestaurantIds, selectedRestaurantId),
    [selectedRestaurantId, visibleRestaurantIds]
  )

  const updateStatusMutation = useMutation({
    mutationFn: updateStatusRequest,
    onMutate: async (nextStatus) => {
      await queryClient.cancelQueries({ queryKey: statusSnapshotQueryKey })

      const previousSnapshot =
        queryClient.getQueryData(statusSnapshotQueryKey) ||
        EMPTY_STATUS_SNAPSHOT

      queryClient.setQueryData(
        statusSnapshotQueryKey,
        mergeStatusIntoSnapshot(previousSnapshot, {
          id: previousSnapshot.statuses[nextStatus.restaurant_key]?.id || `optimistic:${nextStatus.restaurant_key}`,
          restaurant_key: nextStatus.restaurant_key,
          restaurant_name: nextStatus.restaurant_name,
          lat: nextStatus.lat,
          lng: nextStatus.lng,
          status: nextStatus.status,
          note: nextStatus.note || null,
          confirmations: 1,
          updated_at: new Date().toISOString(),
          created_at:
            previousSnapshot.statuses[nextStatus.restaurant_key]?.created_at ||
            new Date().toISOString(),
          viewer_is_author: true,
          viewer_has_confirmed: false,
        })
      )

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(statusSnapshotQueryKey, context.previousSnapshot)
      }
    },
    onSuccess: (status) => {
      queryClient.setQueryData(
        statusSnapshotQueryKey,
        (currentSnapshot) =>
          mergeStatusIntoSnapshot(currentSnapshot || EMPTY_STATUS_SNAPSHOT, status)
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusSnapshotQueryKey })
    },
  })

  const confirmStatusMutation = useMutation({
    mutationFn: (statusData) => confirmStatusRequest(statusData.id),
    onMutate: async (statusData) => {
      await queryClient.cancelQueries({ queryKey: statusSnapshotQueryKey })

      const previousSnapshot =
        queryClient.getQueryData(statusSnapshotQueryKey) ||
        EMPTY_STATUS_SNAPSHOT

      queryClient.setQueryData(
        statusSnapshotQueryKey,
        mergeStatusIntoSnapshot(previousSnapshot, {
          ...statusData,
          confirmations: Number(statusData.confirmations || 0) + 1,
          viewer_has_confirmed: true,
        })
      )

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(statusSnapshotQueryKey, context.previousSnapshot)
      }
    },
    onSuccess: (status) => {
      queryClient.setQueryData(
        statusSnapshotQueryKey,
        (currentSnapshot) =>
          mergeStatusIntoSnapshot(currentSnapshot || EMPTY_STATUS_SNAPSHOT, status)
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusSnapshotQueryKey })
    },
  })

  const importPlaceMutation = useMutation({
    mutationFn: importCatalogPlace,
    onSuccess: ({ restaurant }) => {
      if (!restaurant) {
        return
      }

      queryClient.setQueryData(CATALOG_QUERY_KEY, (currentCatalog) =>
        mergeRestaurantIntoCatalog(currentCatalog, restaurant)
      )
      setSelectedRestaurantId(restaurant.restaurant_key)
      showNotice(`Imported ${restaurant.name}.`, 'neutral')
    },
  })

  const handleSelectRestaurant = (restaurantOrId) => {
    const nextSelectedId =
      typeof restaurantOrId === 'string'
        ? restaurantOrId
        : restaurantOrId?.restaurant_key || null

    setSelectedRestaurantId(nextSelectedId)
  }

  const handleSelectSuggestion = (suggestion) => {
    setSearch(suggestion.label)
    setSelectedRestaurantId(suggestion.restaurantId)
  }

  const selectedRestaurant = selectedRecord?.restaurant || null
  const selectedStatusData = selectedRecord?.statusData || null
  const isFiltering = search !== deferredSearch

  const handleStatusUpdate = async (updateData) => {
    return updateStatusMutation.mutateAsync(updateData)
  }

  const handleConfirm = async (statusData) => {
    return confirmStatusMutation.mutateAsync(statusData)
  }

  const handleImportPlace = async (placeId) => {
    const payload = await importPlaceMutation.mutateAsync(placeId)
    return payload?.restaurant || null
  }

  return (
    <div
      className="app-mobile-shell lg:h-screen lg:overflow-hidden"
      style={{ minHeight: 'var(--app-vh)' }}
    >
      <div
        className="relative app-mobile-shell lg:flex lg:h-full lg:min-h-0"
        style={{ minHeight: 'var(--app-vh)' }}
      >
        <RestaurantPanel
          searchValue={search}
          onSearchChange={setSearch}
          onClearSearch={clearSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          totalCount={catalogIndex.restaurantIds.length}
          resultCount={visibleRestaurantIds.length}
          summaryCounts={summaryCounts}
          selectedRestaurant={selectedRestaurant}
          selectedStatusData={selectedStatusData}
          onClearSelection={clearSelectedRestaurant}
          onStatusUpdate={handleStatusUpdate}
          onConfirm={handleConfirm}
          onNotice={showNotice}
          notice={notice}
          isPending={isFiltering}
        />

        <div
          className="relative app-mobile-stage flex-1 overflow-hidden lg:h-full lg:min-h-0"
          style={{ minHeight: 'var(--app-vh)' }}
        >
          <div className="absolute inset-0">
            <MapView
              restaurantIds={mapRestaurantIds}
              restaurantsById={catalogIndex.restaurantById}
              statusMap={statusMap}
              onSelectRestaurant={handleSelectRestaurant}
              onImportPlace={handleImportPlace}
              onNotice={showNotice}
              selectedRestaurant={selectedRestaurant}
              selectedRestaurantId={selectedRestaurantId}
              onLocateError={(message) => showNotice(message, 'error')}
            />
          </div>

          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,122,69,0.2),transparent_22%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.08),transparent_18%),linear-gradient(180deg,rgba(6,10,22,0.42),transparent_26%,rgba(6,10,22,0.25))]" />

          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            onClearSearch={clearSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            suggestions={suggestions}
            onSelectSuggestion={handleSelectSuggestion}
            resultCount={visibleRestaurantIds.length}
            totalCount={catalogIndex.restaurantIds.length}
            summaryCounts={summaryCounts}
            notice={notice}
            isPending={isFiltering}
            variant="mobile"
          />

          <RestaurantSheet
            restaurant={selectedRestaurant}
            statusData={selectedStatusData}
            onClose={clearSelectedRestaurant}
            onStatusUpdate={handleStatusUpdate}
            onConfirm={handleConfirm}
            onNotice={showNotice}
          />
        </div>
      </div>
    </div>
  )
}
