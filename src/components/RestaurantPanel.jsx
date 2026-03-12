'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

import { buildRestaurantRecord } from '@/lib/catalog-query'

import FilterBar from './FilterBar'
import NoticeBanner from './NoticeBanner'
import RestaurantDetailCard from './RestaurantDetailCard'

export default function RestaurantPanel({
  searchValue,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  suggestions,
  onSelectSuggestion,
  visibleRestaurantIds,
  restaurantById,
  statusMap,
  totalCount,
  resultCount,
  summaryCounts,
  selectedRestaurant,
  selectedRestaurantId,
  selectedStatusData,
  onSelectRestaurant,
  onClearSelection,
  onStatusUpdate,
  onConfirm,
  onNotice,
  notice,
  isPending,
}) {
  const listRef = useRef(null)
  // TanStack Virtual manages an imperative measurement API by design.
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: visibleRestaurantIds.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 154,
    overscan: 8,
  })

  return (
    <aside className="hidden w-[380px] shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,rgba(8,14,30,0.98),rgba(7,11,24,0.96))] lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div className="flex h-full min-h-0 flex-col px-4 py-4">
        <div className="relative z-30 shrink-0 space-y-3">
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,45,0.96),rgba(11,17,34,0.9))] p-4 shadow-[0_22px_54px_rgba(5,8,22,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-[220px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-300/70">
                  Live shortage map
                </div>
                <h1 className="mt-3 font-display text-[1.72rem] font-semibold leading-tight text-white">
                  GasUndo Kochi
                </h1>
                <p className="mt-1 text-sm leading-5 text-slate-300/68">
                  Fast scanning, quick confirmation, zero dead space.
                </p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-right">
                <div className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                  Mapped
                </div>
                <div className="mt-1 font-display text-[1.6rem] font-semibold text-white">
                  {totalCount}
                </div>
                <div className="text-[0.68rem] text-slate-300/55">places</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {[
                { key: 'open', label: 'Open' },
                { key: 'limited', label: 'Limited' },
                { key: 'closed', label: 'Closed' },
                { key: 'unknown', label: 'Unknown' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="rounded-[18px] border border-white/10 bg-white/5 px-3 py-3"
                >
                  <div className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-slate-300/52">
                    {item.label}
                  </div>
                  <div className="mt-1.5 font-display text-[1.2rem] font-semibold text-white">
                    {summaryCounts[item.key]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <NoticeBanner notice={notice} className="rounded-[20px] px-3 py-2.5 text-xs" />

          <FilterBar
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onClearSearch={onClearSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={onStatusFilterChange}
            suggestions={suggestions}
            onSelectSuggestion={onSelectSuggestion}
            resultCount={resultCount}
            totalCount={totalCount}
            summaryCounts={summaryCounts}
            isPending={isPending}
            variant="panel"
          />
        </div>

        {selectedRestaurant ? (
          <div className="mt-4 shrink-0">
            <RestaurantDetailCard
              restaurant={selectedRestaurant}
              statusData={selectedStatusData}
              onClose={onClearSelection}
              onStatusUpdate={onStatusUpdate}
              onConfirm={onConfirm}
              onNotice={onNotice}
              variant="panel"
            />
          </div>
        ) : null}

        <section className="relative z-0 mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/8 bg-[rgba(12,18,36,0.78)] shadow-[0_20px_50px_rgba(5,8,22,0.22)]">
          <div className="sticky top-0 z-[1] border-b border-white/8 bg-[rgba(10,16,31,0.92)] px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-300/52">
                  Results
                </div>
                <div className="mt-1 text-sm text-slate-300/72">
                  {resultCount === totalCount
                    ? `${totalCount} mapped places`
                    : `${resultCount} matching places`}
                </div>
              </div>
              {isPending ? (
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-slate-200/72">
                  Updating
                </span>
              ) : null}
            </div>
          </div>

          {visibleRestaurantIds.length > 0 ? (
            <div
              ref={listRef}
              className="desktop-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1"
            >
              <div
                className="relative px-3 py-3"
                style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                  const restaurantId = visibleRestaurantIds[virtualItem.index]
                  const restaurant = restaurantById[restaurantId]
                  const record = buildRestaurantRecord(restaurant, statusMap)
                  const isSelected =
                    selectedRestaurantId === record.restaurant.restaurant_key

                  return (
                    <div
                      key={record.restaurant.restaurant_key}
                      className="absolute left-0 top-0 w-full px-3"
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectRestaurant(record.restaurant)}
                        aria-pressed={isSelected}
                        className={`w-full rounded-[22px] border px-4 py-3.5 text-left transition ${
                          isSelected
                            ? 'border-white/18 bg-white/12 shadow-[0_16px_34px_rgba(5,8,22,0.26)]'
                            : 'border-white/8 bg-white/5 hover:border-white/14 hover:bg-white/8'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-display text-[1.02rem] font-semibold text-white">
                              {record.restaurant.name}
                            </div>
                            {record.restaurant.brand ? (
                              <div className="mt-1 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-slate-300/48">
                                {record.restaurant.brand}
                              </div>
                            ) : null}
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.22em] ${record.meta.badgeClass}`}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${record.meta.dotClass}`}
                            />
                            {record.meta.label}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3 text-[0.82rem] text-slate-300/72">
                          <span suppressHydrationWarning>{record.freshnessText}</span>
                          <span>
                            {record.confirmations}{' '}
                            {record.confirmations === 1 ? 'confirm' : 'confirms'}
                          </span>
                        </div>

                        <p className="mt-2.5 line-clamp-2 text-sm leading-5 text-slate-200/74">
                          {record.note ||
                            'No note yet. Open this place to report what is available.'}
                        </p>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
              <div className="font-display text-lg font-semibold text-white">
                No places match this filter
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300/70">
                Try clearing the search or switching to another status to see more restaurants.
              </p>
            </div>
          )}
        </section>
      </div>
    </aside>
  )
}
