'use client'

import dynamic from 'next/dynamic'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'

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
import { CATALOG_QUERY_KEY, STATUS_SNAPSHOT_QUERY_KEY } from '@/lib/query-keys'
import { useQueryStore } from '@/store/query-store'
import { fetchCatalog } from '@/services/catalogService'
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

export default function HomeClient({ initialRestaurants, initialError }) {
  const queryClient = useQueryClient()
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
    queryKey: STATUS_SNAPSHOT_QUERY_KEY,
    queryFn: fetchStatusSnapshot,
    initialData: EMPTY_STATUS_SNAPSHOT,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    staleTime: 0,
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

  const showNotice = (message, tone = 'neutral') => {
    setNotice({
      id: Date.now(),
      message,
      tone,
    })
  }

  const updateStatusMutation = useMutation({
    mutationFn: updateStatusRequest,
    onMutate: async (nextStatus) => {
      await queryClient.cancelQueries({ queryKey: STATUS_SNAPSHOT_QUERY_KEY })

      const previousSnapshot =
        queryClient.getQueryData(STATUS_SNAPSHOT_QUERY_KEY) ||
        EMPTY_STATUS_SNAPSHOT

      queryClient.setQueryData(
        STATUS_SNAPSHOT_QUERY_KEY,
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
        })
      )

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          STATUS_SNAPSHOT_QUERY_KEY,
          context.previousSnapshot
        )
      }
    },
    onSuccess: (status) => {
      queryClient.setQueryData(
        STATUS_SNAPSHOT_QUERY_KEY,
        (currentSnapshot) =>
          mergeStatusIntoSnapshot(currentSnapshot || EMPTY_STATUS_SNAPSHOT, status)
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_SNAPSHOT_QUERY_KEY })
    },
  })

  const confirmStatusMutation = useMutation({
    mutationFn: (statusData) => confirmStatusRequest(statusData.id),
    onMutate: async (statusData) => {
      await queryClient.cancelQueries({ queryKey: STATUS_SNAPSHOT_QUERY_KEY })

      const previousSnapshot =
        queryClient.getQueryData(STATUS_SNAPSHOT_QUERY_KEY) ||
        EMPTY_STATUS_SNAPSHOT

      queryClient.setQueryData(
        STATUS_SNAPSHOT_QUERY_KEY,
        mergeStatusIntoSnapshot(previousSnapshot, {
          ...statusData,
          confirmations: Number(statusData.confirmations || 0) + 1,
        })
      )

      return { previousSnapshot }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousSnapshot) {
        queryClient.setQueryData(
          STATUS_SNAPSHOT_QUERY_KEY,
          context.previousSnapshot
        )
      }
    },
    onSuccess: (status) => {
      queryClient.setQueryData(
        STATUS_SNAPSHOT_QUERY_KEY,
        (currentSnapshot) =>
          mergeStatusIntoSnapshot(currentSnapshot || EMPTY_STATUS_SNAPSHOT, status)
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_SNAPSHOT_QUERY_KEY })
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

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden">
      <div className="relative min-h-screen lg:flex lg:h-full lg:min-h-0">
        <RestaurantPanel
          searchValue={search}
          onSearchChange={setSearch}
          onClearSearch={clearSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          visibleRestaurantIds={visibleRestaurantIds}
          restaurantById={catalogIndex.restaurantById}
          statusMap={statusMap}
          totalCount={catalogIndex.restaurantIds.length}
          resultCount={visibleRestaurantIds.length}
          summaryCounts={summaryCounts}
          selectedRestaurant={selectedRestaurant}
          selectedRestaurantId={selectedRestaurantId}
          selectedStatusData={selectedStatusData}
          onSelectRestaurant={handleSelectRestaurant}
          onClearSelection={clearSelectedRestaurant}
          onStatusUpdate={handleStatusUpdate}
          onConfirm={handleConfirm}
          onNotice={showNotice}
          notice={notice}
          isPending={isFiltering}
        />

        <div className="relative min-h-[100dvh] flex-1 overflow-hidden lg:h-full lg:min-h-0">
          <div className="absolute inset-0">
            <MapView
              restaurantIds={mapRestaurantIds}
              restaurantsById={catalogIndex.restaurantById}
              statusMap={statusMap}
              onSelectRestaurant={handleSelectRestaurant}
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
