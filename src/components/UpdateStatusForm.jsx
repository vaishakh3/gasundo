'use client'

import { useState } from 'react'

import { STATUS_META } from '@/lib/status-ui'

const STATUS_OPTIONS = ['open', 'limited', 'closed']

export default function UpdateStatusForm({ restaurant, onSubmit, onCancel }) {
  const [status, setStatus] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!status) return

    setSubmitting(true)
    try {
      await onSubmit({
        restaurant_name: restaurant.name,
        lat: restaurant.lat,
        lng: restaurant.lng,
        status,
        note: note.trim() || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              Report current status
            </h3>
            <p className="mt-1 text-sm text-slate-300/70">
              Pick the latest status for {restaurant.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </button>
        </div>

        {STATUS_OPTIONS.map((value) => {
          const meta = STATUS_META[value]
          const isActive = status === value

          return (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`group flex w-full items-center justify-between gap-4 rounded-[22px] border px-4 py-4 text-left transition-all ${
              isActive
                ? `${meta.badgeClass} ring-2 ring-white/16`
                : 'border-white/10 bg-white/6 text-slate-200/88 hover:border-white/18 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${meta.dotClass}`} />
              <div>
                <div className="font-semibold text-white">{meta.detailLabel}</div>
                <div className="text-sm text-slate-300/70">{meta.detailCopy}</div>
              </div>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] ${
                isActive
                  ? 'border-white/16 bg-white/10 text-white'
                  : 'border-white/10 text-slate-300/75 group-hover:border-white/16'
              }`}
            >
              Select
            </span>
          </button>
          )
        })}
      </div>

      {status ? (
        <>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200/90">
              Add context for other diners
            </span>
            <textarea
              rows={3}
              placeholder="Optional note, for example: no tandoor items or kitchen closing soon."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-28 w-full rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-300/35 focus:border-white/18 focus:outline-none focus:ring-2 focus:ring-white/12"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStatus('')}
              className="flex-1 rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-slate-200/78 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
            >
              Change status
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-[18px] bg-[linear-gradient(135deg,#ffd2a6,#ff7a45)] px-4 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_36px_rgba(255,122,69,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? 'Saving...' : `Report ${STATUS_META[status].label}`}
            </button>
          </div>
        </>
      ) : null}
    </form>
  )
}
