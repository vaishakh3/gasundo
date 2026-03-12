'use client'

import FilterBar from './FilterBar'
import NoticeBanner from './NoticeBanner'
import RestaurantDetailCard from './RestaurantDetailCard'

export default function RestaurantPanel({
  filter,
  onFilterChange,
  restaurants,
  restaurantRecords,
  totalCount,
  resultCount,
  summaryCounts,
  selectedRestaurant,
  selectedStatusData,
  onSelectRestaurant,
  onClearSelection,
  onStatusUpdate,
  onConfirm,
  onNotice,
  notice,
  isPending,
}) {
  return (
    <aside className="hidden w-[380px] shrink-0 border-r border-white/8 bg-[linear-gradient(180deg,rgba(8,14,30,0.98),rgba(7,11,24,0.96))] lg:flex lg:flex-col">
      <div className="flex h-full flex-col overflow-hidden p-5">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,22,45,0.96),rgba(11,17,34,0.9))] p-5 shadow-[0_26px_70px_rgba(5,8,22,0.34)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/70">
                Live shortage map
              </div>
              <h1 className="mt-4 font-display text-[2rem] font-semibold leading-tight text-white">
                GasUndo Kochi
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-300/74">
                Find reliable restaurant updates faster, then confirm or report what you see.
              </p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-right">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                Mapped
              </div>
              <div className="mt-2 font-display text-2xl font-semibold text-white">
                {totalCount}
              </div>
              <div className="text-xs text-slate-300/55">places</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { key: 'open', label: 'Open' },
              { key: 'limited', label: 'Limited' },
              { key: 'closed', label: 'Closed' },
              { key: 'unknown', label: 'Unknown' },
            ].map((item) => (
              <div
                key={item.key}
                className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                  {item.label}
                </div>
                <div className="mt-2 font-display text-2xl font-semibold text-white">
                  {summaryCounts[item.key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-4 overflow-hidden">
          <NoticeBanner notice={notice} />

          <FilterBar
            filter={filter}
            onFilterChange={onFilterChange}
            restaurants={restaurants}
            onSelect={onSelectRestaurant}
            resultCount={resultCount}
            totalCount={totalCount}
            summaryCounts={summaryCounts}
            isPending={isPending}
            variant="panel"
          />

          {selectedRestaurant ? (
            <RestaurantDetailCard
              restaurant={selectedRestaurant}
              statusData={selectedStatusData}
              onClose={onClearSelection}
              onStatusUpdate={onStatusUpdate}
              onConfirm={onConfirm}
              onNotice={onNotice}
              variant="panel"
            />
          ) : null}
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col rounded-[30px] border border-white/8 bg-[rgba(12,18,36,0.78)] shadow-[0_24px_58px_rgba(5,8,22,0.24)]">
          <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
            <div>
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                Results
              </div>
              <div className="mt-1 text-sm text-slate-300/72">
                {resultCount === totalCount
                  ? `${totalCount} mapped places`
                  : `${resultCount} matching places`}
              </div>
            </div>
            {isPending ? (
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-200/72">
                Updating
              </span>
            ) : null}
          </div>

          {restaurantRecords.length > 0 ? (
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {restaurantRecords.map((record) => {
                const isSelected = selectedRestaurant?.id === record.restaurant.id

                return (
                  <button
                    key={record.key}
                    type="button"
                    onClick={() => onSelectRestaurant(record.restaurant)}
                    aria-pressed={isSelected}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '124px' }}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? 'border-white/18 bg-white/12 shadow-[0_18px_38px_rgba(5,8,22,0.28)]'
                        : 'border-white/8 bg-white/5 hover:border-white/14 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-display text-lg font-semibold text-white">
                          {record.restaurant.name}
                        </div>
                        {record.restaurant.brand ? (
                          <div className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300/48">
                            {record.restaurant.brand}
                          </div>
                        ) : null}
                      </div>
                      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${record.meta.badgeClass}`}>
                        <span className={`h-2.5 w-2.5 rounded-full ${record.meta.dotClass}`} />
                        {record.meta.label}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-300/72">
                      <span>{record.freshnessText}</span>
                      <span>
                        {record.confirmations} {record.confirmations === 1 ? 'confirm' : 'confirms'}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-200/74">
                      {record.note || 'No note yet. Open this place to report what is available.'}
                    </p>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center px-8 py-10 text-center">
              <div>
                <div className="font-display text-xl font-semibold text-white">
                  No places match this filter
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300/70">
                  Try clearing the search or switching to another status to see more restaurants.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
