import { useState } from 'react'

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: '🟢 Open' },
  { value: 'limited', label: '🟡 Limited' },
  { value: 'closed', label: '🔴 Closed' },
]

export default function FilterBar({ onFilterChange, filter }) {
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <div className="absolute top-20 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search restaurants..."
          value={filter.search}
          onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className={`w-full px-4 py-2.5 pl-9 rounded-xl text-sm text-white placeholder-white/30 border transition-all backdrop-blur-md
            ${searchFocused
              ? 'bg-[#1a1a2e]/95 border-white/20'
              : 'bg-[#1a1a2e]/80 border-white/5'
            }`}
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">🔍</span>
        {filter.search && (
          <button
            onClick={() => onFilterChange({ ...filter, search: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm hover:text-white/60"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => onFilterChange({ ...filter, statusFilter: sf.value })}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all backdrop-blur-md
              ${filter.statusFilter === sf.value
                ? 'bg-white text-gray-900'
                : 'bg-[#1a1a2e]/80 text-white/60 border border-white/5'
              }`}
          >
            {sf.label}
          </button>
        ))}
      </div>
    </div>
  )
}
