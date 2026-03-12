'use client'

export default function DesktopBottomBar({
  resultCount,
  totalCount,
  isPending,
}) {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 right-24 z-[1001] hidden lg:block">
      <div className="pointer-events-auto inline-flex max-w-[680px] items-center gap-4 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,36,0.9),rgba(8,14,30,0.86))] px-5 py-4 shadow-[0_22px_50px_rgba(5,8,22,0.34)] backdrop-blur-2xl">
        <div className="min-w-0 flex-1">
          <div className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-slate-300/52">
            Map focus
          </div>
          <div className="mt-1 font-display text-[1.08rem] font-semibold text-white">
            {resultCount === totalCount
              ? `${totalCount} mapped places`
              : `${resultCount} places on the map`}
          </div>
          <p className="mt-1 text-sm text-slate-300/70">
            Search and status filters narrow the map directly. Pick a suggestion or marker to open details.
          </p>
        </div>

        {isPending ? (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-slate-200/72">
            Updating
          </span>
        ) : null}
      </div>
    </div>
  )
}
