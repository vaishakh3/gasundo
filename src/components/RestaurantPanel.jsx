'use client'

import DistrictSelect from './DistrictSelect'
import FilterBar from './FilterBar'
import NoticeBanner from './NoticeBanner'
import RestaurantDetailCard from './RestaurantDetailCard'

export default function RestaurantPanel({
  districtOptions,
  selectedDistrict,
  onDistrictChange,
  searchValue,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  suggestions,
  onSelectSuggestion,
  totalCount,
  resultCount,
  summaryCounts,
  selectedRestaurant,
  selectedStatusData,
  onClearSelection,
  onStatusUpdate,
  onConfirm,
  onNotice,
  notice,
  isPending,
}) {
  return (
    <aside className="hidden w-[380px] shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,rgba(8,14,30,0.98),rgba(7,11,24,0.96))] lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div className="desktop-sidebar-scroll flex h-full min-h-0 flex-col overflow-y-auto px-4 py-4">
        <div className="relative z-30 space-y-3">
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,45,0.96),rgba(11,17,34,0.9))] p-4 shadow-[0_22px_54px_rgba(5,8,22,0.28)]">
            <div className="flex items-start justify-between gap-3">
              <div className="max-w-[220px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-slate-300/70">
                  Kerala LPG shortage
                </div>
                <div className="mt-3 font-display text-[1.72rem] font-semibold leading-tight text-white">
                  GasUndo:
                </div>
                <div className="mt-2">
                  <DistrictSelect
                    districtOptions={districtOptions}
                    selectedDistrict={selectedDistrict}
                    onDistrictChange={onDistrictChange}
                    variant="hero"
                  />
                </div>
                <h1 className="mt-2 font-display text-[1.72rem] font-semibold leading-tight text-white">
                  restaurant status map
                </h1>
                <p className="mt-1 text-sm leading-5 text-slate-300/68">
                  Find restaurants open in {selectedDistrict?.name}, limited-menu
                  updates, and closures in real time.
                </p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 px-3 py-3 text-right">
                <div className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                  Mapped
                </div>
                <div className="mt-1 font-display text-[1.6rem] font-semibold text-white">
                  {totalCount}
                </div>
                <div className="text-[0.68rem] text-slate-300/55">
                  {isPending ? 'updating...' : 'places'}
                </div>
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
                  className="min-w-0 rounded-[18px] border border-white/10 bg-white/5 px-3 py-3"
                >
                  <div className="truncate text-[0.52rem] font-semibold uppercase tracking-[0.16em] text-slate-300/52">
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
          >
            {selectedRestaurant ? (
              <RestaurantDetailCard
                restaurant={selectedRestaurant}
                statusData={selectedStatusData}
                onClose={onClearSelection}
                onStatusUpdate={onStatusUpdate}
                onConfirm={onConfirm}
                onNotice={onNotice}
                variant="embedded"
              />
            ) : null}
          </FilterBar>
        </div>
      </div>
    </aside>
  )
}
