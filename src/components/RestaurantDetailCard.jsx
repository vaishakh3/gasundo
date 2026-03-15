'use client'

import { useEffect, useState } from 'react'

import { useAuth } from './AuthProvider'
import CommentThread from './CommentThread'
import UpdateStatusForm from './UpdateStatusForm'
import { buildRestaurantShareUrl } from '@/lib/app-links'
import useTimeAgo from '@/hooks/useTimeAgo'
import { buildGoogleMapsPlaceUrl } from '@/lib/map-links'
import { getStatusMeta } from '@/lib/status-ui'

function GoogleMapsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M12 2.75c-3.52 0-6.38 2.82-6.38 6.3 0 4.76 5.3 10.48 5.52 10.72a1.15 1.15 0 0 0 1.72 0c.22-.24 5.52-5.96 5.52-10.72 0-3.48-2.86-6.3-6.38-6.3Z"
        fill="#EA4335"
      />
      <path
        d="M12 5.9a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
        fill="#FFF"
      />
      <path
        d="M6 6.4 3.75 7.7v11.8L6 18.2V6.4Z"
        fill="#34A853"
      />
      <path
        d="m6 6.4 5 1.95v11.8L6 18.2V6.4Z"
        fill="#FBBC04"
      />
      <path
        d="m11 8.35 5-1.95v11.8l-5 1.95V8.35Z"
        fill="#4285F4"
      />
      <path
        d="M16 6.4 20.25 4.9v11.8L16 18.2V6.4Z"
        fill="#1A73E8"
      />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <circle cx="18" cy="5.5" r="2.75" fill="currentColor" />
      <circle cx="6" cy="12" r="2.75" fill="currentColor" />
      <circle cx="18" cy="18.5" r="2.75" fill="currentColor" />
      <path
        d="m8.45 10.82 6.96-3.96m-6.96 6.32 6.96 3.96"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M10.53 5.47a.75.75 0 0 1 0 1.06L5.81 11.25H20a.75.75 0 0 1 0 1.5H5.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

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
  const {
    viewer,
    isAuthenticated,
    isReady: authReady,
    isSigningIn,
    signInWithGoogle,
  } = useAuth()
  const [showComposer, setShowComposer] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const { text: timeAgoText, isStale } = useTimeAgo(statusData?.updated_at)
  const isEmbedded = variant === 'embedded'

  useEffect(() => {
    setShowComposer(false)
  }, [restaurant?.restaurant_key])

  if (!restaurant) return null

  const status = statusData?.status || 'unknown'
  const statusMeta = getStatusMeta(status)
  const googleMapsUrl = buildGoogleMapsPlaceUrl(restaurant)
  const confirmations = statusData?.confirmations || 0
  const hasKnownStatus = status !== 'unknown' && Boolean(statusData?.id)
  const viewerIsAuthor = Boolean(statusData?.viewer_is_author)
  const viewerHasConfirmed = Boolean(statusData?.viewer_has_confirmed)
  const confirmDisabled =
    !authReady || confirming || viewerIsAuthor || viewerHasConfirmed
  const isPanel = variant === 'panel' || isEmbedded
  const address =
    typeof restaurant.address === 'string' ? restaurant.address.trim() : ''
  const surfaceClass =
    isEmbedded
      ? 'p-0'
      : isPanel
      ? 'rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,50,0.94),rgba(11,17,34,0.94))] p-5 shadow-[0_22px_52px_rgba(5,8,22,0.3)]'
      : 'rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,50,0.98),rgba(8,14,30,0.98))] px-5 pb-6 pt-2 shadow-[0_28px_70px_rgba(5,8,22,0.46)]'
  const headerClass = 'space-y-4'
  const primaryGridClass = isPanel
    ? 'grid gap-4 grid-cols-[1.1fr_0.9fr]'
    : 'grid gap-3 sm:grid-cols-[1.25fr_0.95fr]'
  const secondaryGridClass = isPanel ? 'grid gap-3.5' : 'grid gap-3 sm:grid-cols-2'
  const bodyClass = isEmbedded
    ? 'mt-4 space-y-4'
    : isPanel
    ? 'mt-5 space-y-4 border-t border-white/8 pt-4'
    : `space-y-4 ${stickyHeader ? 'pt-5' : ''}`
  const actionClass = isPanel
    ? 'flex flex-col gap-2.5'
    : 'flex flex-col gap-3 sm:flex-row'
  const accountCopy = isAuthenticated
    ? `Signed in as ${viewer?.label || 'Google user'}`
    : hasKnownStatus
    ? 'Sign in once to confirm this update, report a newer status, and comment below.'
    : 'Sign in once to report the first update and join the comments below.'

  const handleShare = async () => {
    if (typeof window === 'undefined') {
      return
    }

    const appShareUrl = buildRestaurantShareUrl(window.location.href, restaurant)

    if (!appShareUrl) {
      onNotice?.('No restaurant link is available right now.', 'error')
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(appShareUrl)
        onNotice?.('Restaurant link copied.', 'success')
        return
      }

      window.prompt('Copy this restaurant link', appShareUrl)
    } catch {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(appShareUrl)
          onNotice?.('Restaurant link copied.', 'success')
          return
        } catch {
          // Fall through to the final error notice.
        }
      }

      onNotice?.('Could not copy this restaurant right now.', 'error')
    }
  }

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
    if (!statusData?.id || confirmDisabled) return

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

  const handleSignIn = async () => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      await signInWithGoogle(window.location.href)
    } catch (error) {
      onNotice?.(
        error.message || 'Could not start Google sign-in right now.',
        'error'
      )
    }
  }

  return (
    <section className={surfaceClass}>
      <div
        className={`${headerClass} ${stickyHeader ? 'sticky top-0 z-10 -mx-5 -mt-2 rounded-b-[28px] border-b border-white/8 bg-[rgba(10,16,34,0.94)] px-5 pb-4 pt-3 backdrop-blur-2xl' : ''}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className={`min-w-0 ${isPanel ? 'max-w-[220px] space-y-2' : 'space-y-2'}`}
          >
            {restaurant.brand ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-300/72">
                {restaurant.brand}
              </span>
            ) : null}
            <div>
              <h2
                className={`font-display font-semibold leading-tight text-white ${isPanel ? 'text-[1.35rem]' : 'text-[1.7rem]'}`}
              >
                {restaurant.name}
              </h2>
              {address ? (
                <p
                  className={`mt-1 max-w-xl text-slate-300/78 ${
                    isPanel ? 'text-[0.82rem] leading-5' : 'text-sm leading-6'
                  }`}
                >
                  {address}
                </p>
              ) : null}
              {isPanel ? (
                <p className="mt-1.5 max-w-[26ch] text-[0.8rem] leading-6 text-slate-300/62">
                  Latest crowd report for this place.
                </p>
              ) : (
                <p className="mt-2 max-w-xl text-sm text-slate-300/72">
                  Crowd-reported status for this place during the Kerala LPG shortage.
                </p>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              aria-label={`Copy ${restaurant.name} link`}
              title="Copy restaurant link"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/18 hover:bg-white/10 hover:text-white"
            >
              <ShareIcon />
            </button>
            {googleMapsUrl ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${restaurant.name} in Google Maps`}
                title="Open in Google Maps"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/18 hover:bg-white/10 hover:text-white"
              >
                <GoogleMapsIcon />
              </a>
            ) : null}
            {isPanel && onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Back to map"
                title="Back to map"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white transition hover:border-white/18 hover:bg-white/10 hover:text-white"
              >
                <BackIcon />
              </button>
            ) : null}
          </div>
        </div>

        <div className={primaryGridClass}>
          <div
            className={`rounded-[22px] border border-white/10 bg-white/6 ${isPanel ? 'min-h-[152px] p-4' : 'p-4'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={isPanel ? 'space-y-2.5' : 'space-y-2'}>
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${statusMeta.badgeClass}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${statusMeta.dotClass}`} />
                  {statusMeta.label}
                </span>
                <div>
                  <div
                    className={`font-display font-semibold text-white ${isPanel ? 'text-lg' : 'text-xl'}`}
                  >
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

          <div
            className={`rounded-[22px] border border-white/10 bg-white/6 ${isPanel ? 'min-h-[152px] p-4' : 'p-4'}`}
          >
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
              Freshness
            </div>
            <div
              className={`mt-3.5 font-display font-semibold text-white ${isPanel ? 'text-[1.15rem]' : 'text-lg'}`}
            >
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
            <div
              className={`mt-2.5 font-semibold text-white ${isPanel ? 'text-[1.02rem]' : 'text-lg'}`}
            >
              {confirmations} {confirmations === 1 ? 'confirmation' : 'confirmations'}
            </div>
            <p className={`${isPanel ? 'mt-1.5 text-xs leading-6' : 'mt-1 text-sm'} text-slate-300/72`}>
              Community check-ins supporting the latest report.
            </p>
          </div>

          <div className="rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
              Thread
            </div>
            <div
              className={`${isPanel ? 'mt-2.5 text-[0.82rem] leading-6' : 'mt-2 text-sm leading-6'} text-slate-200/88`}
            >
              Signed-in diners can add markdown tips, edit their own comments, and
              vote useful updates up.
            </div>
          </div>
        </div>

        {showComposer ? (
          <UpdateStatusForm
            restaurant={restaurant}
            onSubmit={handleSubmit}
            onCancel={() => setShowComposer(false)}
          />
        ) : (
          <>
            <div className="text-xs text-slate-300/58">{accountCopy}</div>
            <div className={actionClass}>
              {isAuthenticated ? (
                <>
                  {hasKnownStatus ? (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirmDisabled}
                    className={`flex-1 rounded-[18px] border border-white/10 bg-white/6 font-semibold text-slate-100 transition hover:border-white/18 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                      isPanel ? 'px-4 py-3 text-[0.92rem]' : 'px-4 py-4 text-sm'
                    }`}
                  >
                    {confirming
                      ? 'Confirming...'
                      : viewerIsAuthor
                        ? 'You reported this status'
                        : viewerHasConfirmed
                          ? 'Already confirmed'
                          : 'Confirm this update'}
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
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={!authReady || isSigningIn}
                  className={`flex-1 rounded-[18px] bg-[linear-gradient(135deg,#ffd2a6,#ff7a45)] font-semibold text-slate-950 shadow-[0_18px_36px_rgba(255,122,69,0.26)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 ${
                    isPanel ? 'px-4 py-3 text-[0.92rem]' : 'px-4 py-4 text-sm'
                  }`}
                >
                  {isSigningIn ? 'Redirecting...' : 'Sign in with Google'}
                </button>
              )}
            </div>
          </>
        )}

        <CommentThread
          key={`${restaurant.restaurant_key}:${statusData?.id || 'none'}`}
          restaurant={restaurant}
          statusData={statusData}
          onNotice={onNotice}
          compact={isPanel}
        />
      </div>
    </section>
  )
}
