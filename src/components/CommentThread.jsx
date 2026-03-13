'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'

import { formatTimeAgo } from '@/lib/time-ago'
import { getRestaurantCommentsQueryKey } from '@/lib/query-keys'
import { isUuid } from '@/lib/uuid'
import {
  createComment,
  fetchStatusComments,
  upvoteComment,
} from '@/services/commentService'

function UpvoteIcon({ active = false, busy = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`h-4 w-4 transition ${busy ? 'scale-95 opacity-75' : ''} ${
        active ? 'fill-current' : 'fill-none'
      }`}
    >
      <path
        d="M10 3.5 4.75 9.25h3.15V16.5h4.2V9.25h3.15L10 3.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function getVoteButtonLabel(comment, isVoting) {
  if (isVoting) {
    return 'Submitting upvote'
  }

  if (comment.is_own_comment) {
    return `Your comment has ${comment.upvote_count} upvotes`
  }

  if (comment.viewer_has_upvoted) {
    return `Upvoted comment with ${comment.upvote_count} upvotes`
  }

  return `Upvote comment with ${comment.upvote_count} upvotes`
}

export default function CommentThread({
  restaurant,
  statusData,
  onNotice,
  compact = false,
}) {
  const queryClient = useQueryClient()
  const [draftState, setDraftState] = useState({
    statusId: null,
    value: '',
  })
  const [nowTimestamp, setNowTimestamp] = useState(null)

  const statusId = statusData?.id || null
  const restaurantKey = restaurant?.restaurant_key || statusData?.restaurant_key || null
  const canLoadComments = Boolean(restaurantKey) && isUuid(statusId)
  const draft = draftState.statusId === statusId ? draftState.value : ''

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setNowTimestamp(Date.now())
    })

    const intervalId = window.setInterval(() => {
      setNowTimestamp(Date.now())
    }, 30000)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearInterval(intervalId)
    }
  }, [])

  const commentsQuery = useQuery({
    queryKey: getRestaurantCommentsQueryKey(restaurantKey || 'unknown'),
    queryFn: () =>
      fetchStatusComments({
        statusId,
        restaurantKey,
      }),
    enabled: canLoadComments,
    staleTime: 0,
  })

  const sortedComments = useMemo(
    () =>
      (commentsQuery.data || []).map((comment) => ({
        ...comment,
        freshnessText: formatTimeAgo(comment.created_at, nowTimestamp),
      })),
    [commentsQuery.data, nowTimestamp]
  )

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setDraftState({
        statusId,
        value: '',
      })
      queryClient.invalidateQueries({
        queryKey: getRestaurantCommentsQueryKey(restaurantKey || 'unknown'),
      })
    },
  })

  const upvoteCommentMutation = useMutation({
    mutationFn: upvoteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getRestaurantCommentsQueryKey(restaurantKey || 'unknown'),
      })
    },
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canLoadComments || !draft.trim()) {
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        status_id: statusId,
        restaurant_key: restaurant.restaurant_key,
        content: draft.trim(),
      })
      onNotice?.('Comment posted.', 'success')
    } catch (error) {
      onNotice?.(error.message || 'Could not post your comment right now.', 'error')
    }
  }

  const handleUpvote = async (commentId) => {
    try {
      await upvoteCommentMutation.mutateAsync(commentId)
    } catch (error) {
      onNotice?.(error.message || 'Could not upvote this comment right now.', 'error')
    }
  }

  if (!canLoadComments) {
    return (
      <section className="rounded-[20px] border border-white/10 bg-white/5 p-4">
        <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
          Community comments
        </div>
        <p className="mt-2 break-words text-sm leading-6 text-slate-300/72">
          Report the first status update to start the discussion for {restaurant.name}.
        </p>
      </section>
    )
  }

  const sectionPadding = compact ? 'p-4' : 'p-5'
  const summaryTextClass = compact
    ? 'mt-2 text-[0.82rem] leading-5 text-slate-300/72'
    : 'mt-2 text-sm text-slate-300/72'
  const helperText = compact
    ? 'One vote per device with a local pseudonymous ID.'
    : 'Votes are limited per device using a local pseudonymous ID.'
  const helperRowClass = compact
    ? 'flex flex-col gap-2.5'
    : 'flex items-center justify-between gap-3'
  const helperTextClass = compact
    ? 'max-w-full text-[0.72rem] leading-5 text-slate-300/55'
    : 'text-xs text-slate-300/55'
  const commentListClass = compact ? 'mt-4 space-y-2.5' : 'mt-5 space-y-3'

  return (
    <section className={`rounded-[20px] border border-white/10 bg-white/5 ${sectionPadding}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
            Community comments
          </div>
          <div className={summaryTextClass}>
            {sortedComments.length === 0
              ? 'No comments yet. Add the first one.'
              : `${sortedComments.length} ${sortedComments.length === 1 ? 'comment' : 'comments'} for this place.`}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <textarea
          rows={3}
          value={draft}
          onChange={(event) =>
            setDraftState({
              statusId,
              value: event.target.value,
            })
          }
          placeholder="Add a comment or local tip for this status update."
          className="min-h-24 w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-300/35 focus:border-white/18 focus:outline-none focus:ring-2 focus:ring-white/12"
        />
        <div className={helperRowClass}>
          <div className={helperTextClass}>
            {helperText}
          </div>
          <button
            type="submit"
            disabled={createCommentMutation.isPending || !draft.trim()}
            className={`rounded-[16px] bg-[linear-gradient(135deg,#ffd2a6,#ff7a45)] px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_rgba(255,122,69,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55 ${
              compact ? 'self-end' : ''
            }`}
          >
            {createCommentMutation.isPending ? 'Posting...' : 'Post comment'}
          </button>
        </div>
      </form>

      <div className={commentListClass}>
        {commentsQuery.isLoading ? (
          <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4 text-sm text-slate-300/70">
            Loading comments...
          </div>
        ) : sortedComments.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/12 bg-white/4 px-4 py-4 text-sm text-slate-300/68">
            This report does not have any comments yet.
          </div>
        ) : (
          sortedComments.map((comment) => {
            const isVoting =
              upvoteCommentMutation.isPending &&
              upvoteCommentMutation.variables === comment.id

            return (
              <article
                key={comment.id}
                className={`rounded-[18px] border border-white/10 bg-white/6 ${
                  compact ? 'px-3.5 py-3.5' : 'px-4 py-4'
                }`}
              >
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <div
                      className={`flex flex-wrap items-center gap-x-2 gap-y-1 uppercase text-slate-300/55 ${
                        compact
                          ? 'text-[0.62rem] tracking-[0.18em]'
                          : 'text-xs tracking-[0.22em]'
                      }`}
                    >
                      <span className="break-words">{comment.author_label}</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span>{comment.freshnessText || 'recently'}</span>
                    </div>
                    <p
                      className={`mt-2 break-words whitespace-pre-wrap text-slate-100/92 ${
                        compact ? 'text-[0.84rem] leading-5' : 'text-sm leading-6'
                      }`}
                    >
                      {comment.content}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpvote(comment.id)}
                    aria-label={getVoteButtonLabel(comment, isVoting)}
                    title={getVoteButtonLabel(comment, isVoting)}
                    disabled={
                      isVoting || comment.viewer_has_upvoted || comment.is_own_comment
                    }
                    className={`shrink-0 rounded-[14px] border px-2 py-1.5 text-[0.66rem] font-semibold transition ${
                      comment.is_own_comment
                        ? 'border-white/10 bg-white/4 text-slate-300/55'
                        : ''
                    } ${
                      comment.viewer_has_upvoted
                        ? 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100'
                        : !comment.is_own_comment
                        ? 'border-white/10 bg-white/6 text-slate-200/75 hover:border-white/18 hover:bg-white/10 hover:text-white'
                        : ''
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <span className="flex min-w-[2.2rem] flex-col items-center justify-center gap-0.5 leading-none">
                      <UpvoteIcon
                        active={comment.viewer_has_upvoted || comment.is_own_comment}
                        busy={isVoting}
                      />
                      <span>{comment.upvote_count}</span>
                    </span>
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </section>
  )
}
