import { useState } from 'react'

const STATUS_FILTERS = [
  { 
    value: 'all', 
    label: 'All', 
    activeClass: 'bg-white text-gray-900 border-white',
    dotClass: null
  },
  { 
    value: 'open', 
    label: 'Open', 
    activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
    dotClass: 'bg-emerald-500'
  },
  { 
    value: 'limited', 
    label: 'Limited', 
    activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
    dotClass: 'bg-amber-500'
  },
  { 
    value: 'closed', 
    label: 'Closed', 
    activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
    dotClass: 'bg-rose-500'
  },
]

export default function FilterBar({ onFilterChange, filter, restaurants = [], onSelect }) {
  const [searchFocused, setSearchFocused] = useState(false)

  // Get up to 5 unique suggestions matching the search
  const suggestions = filter.search
    ? Array.from(new Set(
        restaurants
          .filter(r => r.name.toLowerCase().includes(filter.search.toLowerCase()))
          .map(r => r.name)
      )).slice(0, 5)
    : []

  return (
    <div className="absolute top-16 left-3 right-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
      {/* Search */}
      <div className="relative z-10">
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
        
        {/* Dropdown Suggestions */}
        {searchFocused && filter.search && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e]/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onMouseDown={(e) => {
                  e.preventDefault() // prevent input blur
                  
                  // Find the full restaurant object
                  const selectedRest = restaurants.find(r => r.name === sug)
                  
                  onFilterChange({ ...filter, search: sug })
                  
                  if (selectedRest && onSelect) {
                    onSelect(selectedRest)
                  }
                  
                  setSearchFocused(false)
                }}
                className="w-full text-left px-4 py-3 text-sm text-white/90 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {STATUS_FILTERS.map((sf) => {
          const isActive = filter.statusFilter === sf.value
          return (
            <button
              key={sf.value}
              onClick={() => onFilterChange({ ...filter, statusFilter: sf.value })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all backdrop-blur-md flex items-center gap-1.5 border
                ${isActive
                  ? sf.activeClass
                  : 'bg-[#1a1a2e]/80 text-white/60 border-white/5 hover:bg-white/10 hover:text-white/90'
                }`}
            >
              {sf.dotClass && (
                <span className={`w-2 h-2 rounded-full shadow-sm ${isActive ? sf.dotClass : 'bg-white/30'}`} />
              )}
              {sf.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
