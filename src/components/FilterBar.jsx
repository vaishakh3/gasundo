'use client'

import { useState } from 'react'

import NoticeBanner from './NoticeBanner'
import { STATUS_FILTERS, STATUS_META } from '@/lib/status-ui'

function getFilterCount(value, totalCount, summaryCounts) {
  if (value === 'all') return totalCount
  return summaryCounts[value] || 0
}

export default function FilterBar({
  onFilterChange,
  filter,
  restaurants = [],
  onSelect,
  resultCount = 0,
  totalCount = 0,
  summaryCounts = { open: 0, limited: 0, closed: 0, unknown: 0 },
  notice = null,
  isPending = false,
  variant = 'mobile',
}) {
  const [searchFocused, setSearchFocused] = useState(false)

  const suggestions = filter.search
    ? Array.from(
        new Set(
          restaurants
            .filter((restaurant) =>
              restaurant.name.toLowerCase().includes(filter.search.toLowerCase())
            )
            .map((restaurant) => restaurant.name)
        )
      ).slice(0, 5)
    : []

  const rootClass =
    variant === 'mobile'
      ? 'pointer-events-none absolute inset-x-0 top-0 z-[1000] px-3 pb-4 pt-[max(12px,env(safe-area-inset-top))] lg:hidden'
      : 'flex flex-col gap-3'
  const cardClass =
    variant === 'mobile'
      ? 'pointer-events-auto rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,36,0.88),rgba(10,16,32,0.74))] px-4 py-4 shadow-[0_24px_60px_rgba(5,8,22,0.35)] backdrop-blur-2xl'
      : 'rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,23,46,0.9),rgba(10,16,31,0.78))] p-3 shadow-[0_18px_44px_rgba(5,8,22,0.2)] backdrop-blur-2xl'

  const handleSelectSuggestion = (suggestion) => {
    const selectedRestaurant = restaurants.find(
      (restaurant) => restaurant.name === suggestion
    )

    onFilterChange({ ...filter, search: suggestion })

    if (selectedRestaurant && onSelect) {
      onSelect(selectedRestaurant)
    }

    setSearchFocused(false)
  }

  return (
    <div className={rootClass}>
      <div className={cardClass}>
        {variant === 'mobile' ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="max-w-[220px]">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/68">
                  Live shortage map
                </div>
                <h1 className="mt-3 font-display text-[1.7rem] font-semibold leading-tight text-white">
                  GasUndo Kochi
                </h1>
                <p className="mt-1 text-[0.95rem] text-slate-300/72">
                  Find fresh restaurant updates fast.
                </p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/6 px-4 py-3 text-right shadow-[0_18px_36px_rgba(5,8,22,0.2)]">
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                  Results
                </div>
                <div className="mt-2 font-display text-2xl font-semibold text-white">
                  {resultCount}
                </div>
                <div className="text-xs text-slate-300/55">
                  {resultCount === totalCount ? 'all mapped places' : 'matching places'}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar">
              {[
                { key: 'open', label: 'Open' },
                { key: 'limited', label: 'Limited' },
                { key: 'closed', label: 'Closed' },
                { key: 'unknown', label: 'Unknown' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="min-w-[112px] rounded-[20px] border border-white/10 bg-white/6 px-4 py-3"
                >
                  <div className="text-[0.66rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
                    {item.label}
                  </div>
                  <div className="mt-2 font-display text-lg font-semibold text-white">
                    {summaryCounts[item.key]}
                  </div>
                </div>
              ))}
            </div>

            <NoticeBanner notice={notice} className="mt-4" />
          </>
        ) : null}

        <div className={`relative z-10 ${variant === 'mobile' ? 'mt-4' : ''}`}>
          <label className="sr-only" htmlFor={`restaurant-search-${variant}`}>
            Search restaurants
          </label>
          <input
            id={`restaurant-search-${variant}`}
            type="text"
            placeholder="Search restaurants"
            value={filter.search}
            onChange={(event) =>
              onFilterChange({ ...filter, search: event.target.value })
            }
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full rounded-[22px] border px-4 text-sm text-white transition placeholder:text-slate-300/38 focus:outline-none focus:ring-2 focus:ring-white/12 ${
              variant === 'panel' ? 'py-2.5 pl-10' : 'py-3 pl-11'
            } ${
              searchFocused
                ? 'border-white/18 bg-white/10'
                : 'border-white/10 bg-white/6 hover:border-white/16'
            }`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-base text-slate-300/45 ${
              variant === 'panel' ? 'left-3.5' : 'left-4'
            }`}
          >
            ⌕
          </span>
          {filter.search ? (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filter, search: '' })}
              aria-label="Clear search"
              className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300/72 transition hover:border-white/16 hover:bg-white/10 hover:text-white ${
                variant === 'panel' ? 'px-2 py-1' : 'px-2.5 py-1.5'
              }`}
            >
              Clear
            </button>
          ) : null}

          {searchFocused && filter.search && suggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(10,16,31,0.96)] shadow-[0_24px_50px_rgba(5,8,22,0.34)] backdrop-blur-2xl">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    handleSelectSuggestion(suggestion)
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-white/6 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/8 last:border-b-0"
                >
                  <span>{suggestion}</span>
                  <span className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-300/48">
                    select
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {variant !== 'panel' ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
              {resultCount === totalCount
                ? `${totalCount} mapped places`
                : `${resultCount} matching places`}
            </div>
            {isPending ? (
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-200/72">
                Updating
              </span>
            ) : null}
          </div>
        ) : null}

        <div className={`${variant === 'panel' ? 'mt-2' : 'mt-3'} flex gap-2 overflow-x-auto no-scrollbar`}>
          {STATUS_FILTERS.map((statusFilter) => {
            const isActive = filter.statusFilter === statusFilter.value
            const count = getFilterCount(
              statusFilter.value,
              totalCount,
              summaryCounts
            )
            const statusMeta =
              statusFilter.value !== 'all' ? STATUS_META[statusFilter.value] : null

            return (
              <button
                key={statusFilter.value}
                type="button"
                onClick={() =>
                  onFilterChange({ ...filter, statusFilter: statusFilter.value })
                }
                className={`inline-flex items-center gap-2 rounded-full border text-sm font-semibold whitespace-nowrap transition ${
                  variant === 'panel' ? 'min-h-10 px-3.5 py-2' : 'min-h-11 px-4 py-2.5'
                } ${
                  isActive
                    ? statusMeta
                      ? `${statusMeta.badgeClass} shadow-[0_16px_32px_rgba(5,8,22,0.22)]`
                      : 'border-white/16 bg-white text-slate-950 shadow-[0_16px_32px_rgba(255,255,255,0.12)]'
                    : 'border-white/10 bg-white/6 text-slate-200/78 hover:border-white/16 hover:bg-white/10 hover:text-white'
                }`}
              >
                {statusMeta ? (
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dotClass}`} />
                ) : null}
                <span>{statusFilter.label}</span>
                <span className="rounded-full border border-current/18 px-2 py-0.5 text-[0.68rem]">
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
