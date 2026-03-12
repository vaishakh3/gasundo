'use client'

import { create } from 'zustand'

export const useQueryStore = create((set) => ({
  search: '',
  statusFilter: 'all',
  selectedRestaurantId: null,
  setSearch: (search) => set({ search }),
  clearSearch: () => set({ search: '' }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSelectedRestaurantId: (selectedRestaurantId) => set({ selectedRestaurantId }),
  clearSelectedRestaurant: () => set({ selectedRestaurantId: null }),
}))
