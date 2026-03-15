'use client'

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="h-4 w-4 text-slate-300/68"
    >
      <path
        d="M5.75 7.75 10 12l4.25-4.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default function DistrictSelect({
  districtOptions = [],
  selectedDistrict,
  onDistrictChange,
  variant = 'hero',
}) {
  const selectId = `district-select-${variant}`
  const sizeClass =
    variant === 'hero'
      ? 'min-h-12 rounded-[18px] px-4 pr-11 text-lg'
      : 'min-h-11 rounded-[18px] px-4 pr-11 text-sm'

  return (
    <div className="relative">
      <label className="sr-only" htmlFor={selectId}>
        Select district
      </label>
      <select
        id={selectId}
        value={selectedDistrict?.slug || ''}
        onChange={(event) => onDistrictChange?.(event.target.value)}
        className={`w-full appearance-none border border-white/10 bg-white/6 font-medium text-white shadow-[0_14px_28px_rgba(5,8,22,0.16)] transition focus:border-white/18 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/12 ${sizeClass}`}
      >
        {districtOptions.map((district) => (
          <option key={district.slug} value={district.slug} className="bg-slate-950 text-white">
            {district.name}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
        <ChevronIcon />
      </span>
    </div>
  )
}
