import {
  compareRestaurantRecords,
  getRestaurantDisplayData,
} from './status-ui.js'

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildCatalogIndex(restaurants = []) {
  const restaurantIds = []
  const restaurantById = Object.create(null)
  const searchTextByRestaurantId = Object.create(null)
  const suggestionEntries = []

  for (const restaurant of restaurants) {
    const restaurantId = restaurant.restaurant_key
    const searchText = normalizeSearchText(
      `${restaurant.name} ${restaurant.brand || ''}`
    )

    restaurantIds.push(restaurantId)
    restaurantById[restaurantId] = restaurant
    searchTextByRestaurantId[restaurantId] = searchText
    suggestionEntries.push({
      restaurantId,
      label: restaurant.name,
      brand: restaurant.brand || null,
      searchText,
    })
  }

  return {
    restaurantIds,
    restaurantById,
    searchTextByRestaurantId,
    suggestionEntries,
  }
}

export function buildRestaurantRecord(restaurant, statusSnapshotByKey) {
  return {
    restaurant,
    ...getRestaurantDisplayData(restaurant, statusSnapshotByKey),
  }
}

export function selectSummaryCounts(catalogIndex, statusSnapshotByKey) {
  const summaryCounts = {
    open: 0,
    limited: 0,
    closed: 0,
    unknown: 0,
  }

  for (const restaurantId of catalogIndex.restaurantIds) {
    const restaurant = catalogIndex.restaurantById[restaurantId]
    const status =
      statusSnapshotByKey[restaurant.restaurant_key]?.status || 'unknown'

    summaryCounts[status] += 1
  }

  return summaryCounts
}

export function selectSuggestions(catalogIndex, searchValue, limit = 5) {
  const normalizedSearch = normalizeSearchText(searchValue)

  if (!normalizedSearch) {
    return []
  }

  const suggestions = []
  const seenLabels = new Set()

  for (const entry of catalogIndex.suggestionEntries) {
    if (!entry.searchText.includes(normalizedSearch)) {
      continue
    }

    const suggestionKey = entry.label.toLowerCase()

    if (seenLabels.has(suggestionKey)) {
      continue
    }

    seenLabels.add(suggestionKey)
    suggestions.push(entry)

    if (suggestions.length === limit) {
      break
    }
  }

  return suggestions
}

export function selectVisibleRestaurantIds(
  catalogIndex,
  statusSnapshotByKey,
  queryState
) {
  const normalizedSearch = normalizeSearchText(queryState.search)

  return catalogIndex.restaurantIds
    .filter((restaurantId) => {
      const restaurant = catalogIndex.restaurantById[restaurantId]
      const status =
        statusSnapshotByKey[restaurant.restaurant_key]?.status || 'unknown'

      if (
        queryState.statusFilter !== 'all' &&
        status !== queryState.statusFilter
      ) {
        return false
      }

      if (
        normalizedSearch &&
        !catalogIndex.searchTextByRestaurantId[restaurantId].includes(
          normalizedSearch
        )
      ) {
        return false
      }

      return true
    })
    .sort((leftId, rightId) =>
      compareRestaurantRecords(
        buildRestaurantRecord(catalogIndex.restaurantById[leftId], statusSnapshotByKey),
        buildRestaurantRecord(catalogIndex.restaurantById[rightId], statusSnapshotByKey)
      )
    )
}

export function selectSelectedRecord(
  catalogIndex,
  statusSnapshotByKey,
  selectedRestaurantId
) {
  if (!selectedRestaurantId) {
    return null
  }

  const restaurant = catalogIndex.restaurantById[selectedRestaurantId]

  if (!restaurant) {
    return null
  }

  return buildRestaurantRecord(restaurant, statusSnapshotByKey)
}

export function selectMapRestaurantIds(
  visibleRestaurantIds,
  selectedRestaurantId
) {
  if (
    selectedRestaurantId &&
    !visibleRestaurantIds.includes(selectedRestaurantId)
  ) {
    return [...visibleRestaurantIds, selectedRestaurantId]
  }

  return visibleRestaurantIds
}
