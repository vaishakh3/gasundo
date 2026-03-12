'use client'

import { useEffect, useState } from 'react'

import UpdateStatusForm from './UpdateStatusForm'
import useTimeAgo from '@/hooks/useTimeAgo'
import { getStatusMeta } from '@/lib/status-ui'

export default function RestaurantDetailCard({
  restaurant,
  statusData,
  onClose,
  onStatusUpdate,
  onConfirm,
  onNotice,
  variant = 'sheet',
  stickyHeader = false,
}) {
  const [showComposer, setShowComposer] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { text: timeAgoText, isStale } = useTimeAgo(statusData?.updated_at)

  useEffect(() => {
    setShowComposer(false)
  }, [restaurant?.restaurant_key])

  if (!restaurant) return null

  const status = statusData?.status || 'unknown'
  const statusMeta = getStatusMeta(status)
  const confirmations = statusData?.confirmations || 0
  const hasKnownStatus = status !== 'unknown' && Boolean(statusData?.id)
  const isPanel = variant === 'panel'
  const surfaceClass =
    isPanel
      ? 'rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,50,0.94),rgba(11,17,34,0.94))] p-5 shadow-[0_22px_52px_rgba(5,8,22,0.3)]'
      : 'rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,50,0.98),rgba(8,14,30,0.98))] px-5 pb-6 pt-2 shadow-[0_28px_70px_rgba(5,8,22,0.46)]'
  const headerClass = isPanel ? 'space-y-4' : 'space-y-4'
  const primaryGridClass = isPanel
    ? 'grid gap-4 grid-cols-[1.1fr_0.9fr]'
    : 'grid gap-3 sm:grid-cols-[1.25fr_0.95fr]'
  const secondaryGridClass = isPanel ? 'grid gap-3.5' : 'grid gap-3 sm:grid-cols-2'
  const bodyClass = isPanel
    ? 'mt-5 space-y-4 border-t border-white/8 pt-4'
    : `space-y-4 ${stickyHeader ? 'pt-5' : ''}`
  const actionClass = isPanel ? 'flex flex-col gap-2.5' : 'flex flex-col gap-3 sm:flex-row'

  const handleSubmit = async (updateData) => {
    try {
      await onStatusUpdate(updateData)
      setShowComposer(false)
      onNotice?.('Thanks for helping others find food.', 'success')

      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch (error) {
      onNotice?.(error.message || 'Could not save your update right now.', 'error')
    }
  }

  const handleConfirm = async () => {
    if (!statusData?.id || confirming) return

    setConfirming(true)
    try {
      await onConfirm(statusData)
      onNotice?.('Thanks for confirming this update.', 'success')

      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    } catch (error) {
      onNotice?.(error.message || 'Could not confirm this update right now.', 'error')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <section className={surfaceClass}>
      <div
        className={`${headerClass} ${stickyHeader ? 'sticky top-0 z-10 -mx-5 -mt-2 rounded-b-[28px] border-b border-white/8 bg-[rgba(10,16,34,0.94)] px-5 pb-4 pt-3 backdrop-blur-2xl' : ''}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className={isPanel ? 'max-w-[220px] space-y-2' : 'space-y-2'}>
            {restaurant.brand ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/72">
                {restaurant.brand}
              </span>
            ) : null}
            <div>
              <h2 className={`font-display font-semibold leading-tight text-white ${isPanel ? 'text-[1.35rem]' : 'text-[1.7rem]'}`}>
                {restaurant.name}
              </h2>
              {isPanel ? (
                <p className="mt-1.5 max-w-[26ch] text-[0.8rem] leading-6 text-slate-300/62">
                  Latest crowd report for this place.
                </p>
              ) : (
                <p className="mt-2 max-w-xl text-sm text-slate-300/72">
                  Crowd-reported status for this place during the Kochi LPG shortage.
                </p>
              )}
            </div>
          </div>
          {isPanel && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 shrink-0 rounded-full border border-white/10 bg-white/6 px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-200/75 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
            >
              Back
            </button>
          ) : null}
        </div>

        <div className={primaryGridClass}>
          <div className={`rounded-[22px] border border-white/10 bg-white/6 ${isPanel ? 'min-h-[152px] p-4' : 'p-4'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className={isPanel ? 'space-y-2.5' : 'space-y-2'}>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${statusMeta.badgeClass}`}>
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
                <div>
                  <div className={`font-display font-semibold text-white ${isPanel ? 'text-lg' : 'text-xl'}`}>
                    {statusMeta.detailLabel}
                  </div>
                  <div className={`${isPanel ? 'text-xs' : 'text-sm'} text-slate-300/72`}>
                    {statusMeta.detailCopy}
                  </div>
                </div>
              </div>
              {isStale ? (
                <span className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-amber-100">
                  Stale
                </span>
              ) : null}
            </div>
          </div>

          <div className={`rounded-[22px] border border-white/10 bg-white/6 ${isPanel ? 'min-h-[152px] p-4' : 'p-4'}`}>
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
              Freshness
            </div>
            <div className={`mt-3.5 font-display font-semibold text-white ${isPanel ? 'text-[1.15rem]' : 'text-lg'}`}>
              {statusData?.updated_at ? timeAgoText : 'No recent report'}
            </div>
            <div className={`${isPanel ? 'mt-2 text-xs leading-6' : 'mt-1 text-sm'} text-slate-300/72`}>
              {statusData?.updated_at
                ? 'Based on the latest diner update.'
                : 'Be the first to report this place.'}
            </div>
          </div>
        </div>
      </div>

      <div className={bodyClass}>
        <div className={secondaryGridClass}>
          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
              Trust signal
            </div>
            <div className={`mt-2.5 font-semibold text-white ${isPanel ? 'text-[1.02rem]' : 'text-lg'}`}>
              {confirmations} {confirmations === 1 ? 'confirmation' : 'confirmations'}
            </div>
            <p className={`${isPanel ? 'mt-1.5 text-xs leading-6' : 'mt-1 text-sm'} text-slate-300/72`}>
              Community check-ins supporting the latest report.
            </p>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
              Latest note
            </div>
            <div className={`${isPanel ? 'mt-2.5 text-[0.82rem] leading-6' : 'mt-2 text-sm leading-6'} text-slate-200/88`}>
              {statusData?.note ? statusData.note : 'No note yet. Add one when you report.'}
            </div>
          </div>
        </div>

        {showComposer ? (
          <UpdateStatusForm restaurant={restaurant} onSubmit={handleSubmit} onCancel={() => setShowComposer(false)} />
        ) : (
          <div className={actionClass}>
            {hasKnownStatus ? (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
                className={`flex-1 rounded-[18px] border border-white/10 bg-white/6 font-semibold text-slate-100 transition hover:border-white/18 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isPanel ? 'px-4 py-3 text-[0.92rem]' : 'px-4 py-4 text-sm'
                }`}
              >
                {confirming ? 'Confirming...' : 'Confirm this update'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowComposer(true)}
              className={`flex-1 rounded-[18px] bg-[linear-gradient(135deg,#ffd2a6,#ff7a45)] font-semibold text-slate-950 shadow-[0_18px_36px_rgba(255,122,69,0.26)] transition hover:brightness-105 ${
                isPanel ? 'px-4 py-3 text-[0.92rem]' : 'px-4 py-4 text-sm'
              }`}
            >
              {status === 'unknown' ? 'Report first update' : 'Report a newer status'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
