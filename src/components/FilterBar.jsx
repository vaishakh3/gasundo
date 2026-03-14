'use client'

import { useState } from 'react'

import NoticeBanner from './NoticeBanner'
import { STATUS_FILTERS, STATUS_META } from '@/lib/status-ui'

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="m7.28 7.22 9.5 9.5m0-9.5-9.5 9.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function getFilterCount(value, totalCount, summaryCounts) {
  if (value === 'all') return totalCount
  return summaryCounts[value] || 0
}

function getMobileResultsLabel(resultCount, totalCount) {
  if (resultCount === totalCount) {
    return `${totalCount} mapped`
  }

  return `${resultCount} shown`
}

export default function FilterBar({
  searchValue,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusFilterChange,
  suggestions = [],
  onSelectSuggestion,
  resultCount = 0,
  totalCount = 0,
  summaryCounts = { open: 0, limited: 0, closed: 0, unknown: 0 },
  notice = null,
  isPending = false,
  variant = 'mobile',
  children = null,
}) {
  const [searchFocused, setSearchFocused] = useState(false)

  const rootClass =
    variant === 'mobile'
      ? 'pointer-events-none absolute inset-x-0 top-0 z-[1000] px-3 pb-3 pt-[calc(var(--app-top-offset)+max(8px,env(safe-area-inset-top)))] lg:hidden'
      : 'relative z-30 flex flex-col gap-3'
  const cardClass =
    variant === 'mobile'
      ? 'pointer-events-auto rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,36,0.84),rgba(10,16,32,0.68))] px-3.5 py-3 shadow-[0_20px_44px_rgba(5,8,22,0.28)] backdrop-blur-2xl'
      : 'relative overflow-visible rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,23,46,0.9),rgba(10,16,31,0.78))] p-3 shadow-[0_18px_44px_rgba(5,8,22,0.2)] backdrop-blur-2xl'

  const handleSelectSuggestion = (suggestion) => {
    onSelectSuggestion?.(suggestion)
    setSearchFocused(false)
  }

  const isMobile = variant === 'mobile'
  const usesGridFilterLayout = isMobile || variant === 'panel'
  const searchInputPaddingClass = searchValue ? 'pr-14' : 'pr-4'
  const filterContainerClass = usesGridFilterLayout
    ? `${variant === 'panel' ? 'mt-2' : 'mt-2.5'} grid grid-cols-2 gap-1.5`
    : `${variant === 'panel' ? 'mt-2' : 'mt-2.5'} flex gap-2 overflow-x-auto no-scrollbar`

  return (
    <div className={rootClass}>
      <div className={cardClass} data-mobile-filter={variant === 'mobile' ? 'true' : undefined}>
        {variant === 'mobile' ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-300/68">
                <span className="h-2 w-2 rounded-full bg-[var(--accent-ember)] shadow-[0_0_14px_rgba(255,122,69,0.55)]" />
                GasUndo Kochi
              </div>
              <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-slate-300/68">
                {getMobileResultsLabel(resultCount, totalCount)}
              </div>
            </div>

            <NoticeBanner notice={notice} className="mt-3" />
          </>
        ) : null}

        <div
          className={`relative ${variant === 'panel' ? 'z-40' : 'z-10'} ${variant === 'mobile' ? 'mt-2.5' : ''}`}
        >
          <label className="sr-only" htmlFor={`restaurant-search-${variant}`}>
            Search restaurants
          </label>
          <input
            id={`restaurant-search-${variant}`}
            type="text"
            placeholder="Search restaurants"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full rounded-[22px] border px-4 text-sm text-white transition placeholder:text-slate-300/38 focus:outline-none focus:ring-2 focus:ring-white/12 ${
              variant === 'panel' ? 'py-2.5 pl-10' : 'py-2.5 pl-10.5'
            } ${
              searchFocused
                ? 'border-white/18 bg-white/10'
                : 'border-white/10 bg-white/6 hover:border-white/16'
            } ${searchInputPaddingClass}`}
          />
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-base text-slate-300/45 ${
              variant === 'panel' ? 'left-3.5' : 'left-3.5'
            }`}
          >
            ⌕
          </span>
          {searchValue ? (
            <button
              type="button"
              onClick={onClearSearch}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/6 text-slate-300/72 transition hover:border-white/16 hover:bg-white/10 hover:text-white"
            >
              <ClearIcon />
            </button>
          ) : null}

          {searchFocused && searchValue && suggestions.length > 0 ? (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(10,16,31,0.96)] shadow-[0_24px_50px_rgba(5,8,22,0.34)] backdrop-blur-2xl">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.restaurantId}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault()
                    handleSelectSuggestion(suggestion)
                  }}
                  className="flex w-full items-center justify-between gap-3 border-b border-white/6 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/8 last:border-b-0"
                >
                  <div className="min-w-0">
                    <span className="block truncate">{suggestion.label}</span>
                    {suggestion.brand ? (
                      <div className="mt-1 text-[0.66rem] uppercase tracking-[0.22em] text-slate-300/48">
                        {suggestion.brand}
                      </div>
                    ) : null}
                  </div>
                  {isMobile ? null : (
                    <span className="text-[0.68rem] uppercase tracking-[0.22em] text-slate-300/48">
                      select
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {variant !== 'panel' && variant !== 'mobile' ? (
          <div className="mt-3 flex items-center justify-between gap-3">
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

        <div className={filterContainerClass}>
          {STATUS_FILTERS.map((filterOption) => {
            const isActive = statusFilter === filterOption.value
            const count = getFilterCount(
              filterOption.value,
              totalCount,
              summaryCounts
            )
            const filterLabel =
              isMobile && filterOption.value === 'all'
                ? 'All'
                : filterOption.label
            const statusMeta =
              filterOption.value !== 'all'
                ? STATUS_META[filterOption.value]
                : null

            return (
              <button
                key={filterOption.value}
                type="button"
                onClick={() => onStatusFilterChange(filterOption.value)}
                className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap transition ${
                  isMobile
                    ? 'w-full min-h-10 justify-between gap-1.5 px-3 py-2 text-[0.78rem]'
                    : usesGridFilterLayout
                    ? 'w-full min-h-10 justify-between gap-2 px-3.5 py-2 text-sm'
                    : 'min-h-9.5 gap-2 px-3.5 py-2 text-[0.84rem]'
                } ${
                  isActive
                    ? statusMeta
                      ? `${statusMeta.badgeClass} shadow-[0_16px_32px_rgba(5,8,22,0.22)]`
                      : 'border-white/16 bg-white text-slate-950 shadow-[0_16px_32px_rgba(255,255,255,0.12)]'
                    : 'border-white/10 bg-white/6 text-slate-200/78 hover:border-white/16 hover:bg-white/10 hover:text-white'
                }`}
              >
                {statusMeta ? (
                  <span
                    className={`shrink-0 rounded-full ${statusMeta.dotClass} ${
                      isMobile ? 'h-2 w-2' : 'h-2.5 w-2.5'
                    }`}
                  />
                ) : null}
                <span className={isMobile ? 'truncate' : undefined}>
                  {filterLabel}
                </span>
                <span
                  className={`rounded-full border border-current/18 px-2 py-0.5 ${
                    isMobile ? 'text-[0.62rem]' : 'text-[0.68rem]'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {children ? (
          <div
            className={`${
              variant === 'panel'
                ? 'mt-3 border-t border-white/8 pt-3'
                : 'mt-3'
            }`}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  )
}
