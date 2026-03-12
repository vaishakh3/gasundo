'use client'

export default function NoticeBanner({ notice, className = '' }) {
  if (!notice?.message) return null

  const toneClasses =
    notice.tone === 'error'
      ? 'border-rose-400/30 bg-rose-500/15 text-rose-50'
      : notice.tone === 'success'
        ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-50'
        : 'border-white/12 bg-white/8 text-slate-100'

  return (
    <div
      className={`rounded-[20px] border px-4 py-3 text-sm font-medium shadow-[0_18px_45px_rgba(5,8,22,0.24)] backdrop-blur-xl animate-fade-in ${toneClasses} ${className}`}
      role="status"
      aria-live="polite"
    >
      {notice.message}
    </div>
  )
}
