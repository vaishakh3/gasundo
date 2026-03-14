'use client'

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'

import CommentMarkdown from './CommentMarkdown'
import { useAuth } from './AuthProvider'
import { formatTimeAgo } from '@/lib/time-ago'
import { getRestaurantCommentsQueryKey } from '@/lib/query-keys'
import { isUuid } from '@/lib/uuid'
import {
  createComment,
  deleteComment,
  fetchRestaurantComments,
  updateComment,
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

function getVoteButtonLabel(comment, isVoting, isAuthenticated) {
  if (!isAuthenticated) {
    return 'Sign in with Google to upvote comments'
  }

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

function shouldCollapseComment(comment) {
  return (
    comment.content.length > 320 ||
    comment.content.split('\n').length > 6
  )
}

export default function CommentThread({
  restaurant,
  statusData,
  onNotice,
  compact = false,
}) {
  const queryClient = useQueryClient()
  const { viewer, isAuthenticated, isReady, isSigningIn, signInWithGoogle, signOut } =
    useAuth()
  const sectionRef = useRef(null)
  const [draftState, setDraftState] = useState({
    statusId: null,
    value: '',
  })
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [expandedComments, setExpandedComments] = useState({})
  const [nowTimestamp, setNowTimestamp] = useState(null)
  const [hasEnteredView, setHasEnteredView] = useState(false)

  const statusId = statusData?.id || null
  const restaurantKey =
    restaurant?.restaurant_key || statusData?.restaurant_key || null
  const canLoadComments = Boolean(restaurantKey) && isUuid(statusId)
  const draft = draftState.statusId === statusId ? draftState.value : ''
  const viewerScope = viewer?.userId || 'guest'
  const commentsQueryKey = getRestaurantCommentsQueryKey(
    restaurantKey || 'unknown',
    viewerScope
  )

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

  useEffect(() => {
    if (!canLoadComments || hasEnteredView) {
      return undefined
    }

    if (typeof IntersectionObserver === 'undefined') {
      const frameId = window.requestAnimationFrame(() => {
        setHasEnteredView(true)
      })

      return () => window.cancelAnimationFrame(frameId)
    }

    const target = sectionRef.current

    if (!target) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting)

        if (!isVisible) {
          return
        }

        setHasEnteredView(true)
        observer.disconnect()
      },
      {
        rootMargin: '220px 0px',
      }
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [canLoadComments, hasEnteredView])

  const commentsQuery = useInfiniteQuery({
    queryKey: commentsQueryKey,
    queryFn: ({ pageParam = null }) =>
      fetchRestaurantComments({
        restaurantKey,
        cursor: pageParam,
      }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled: canLoadComments && hasEnteredView,
    staleTime: 30 * 1000,
  })

  const comments = useMemo(
    () =>
      (commentsQuery.data?.pages || [])
        .flatMap((page) => page.comments || [])
        .map((comment) => ({
          ...comment,
          freshnessText: formatTimeAgo(comment.created_at, nowTimestamp),
        })),
    [commentsQuery.data?.pages, nowTimestamp]
  )

  const invalidateComments = () =>
    queryClient.invalidateQueries({ queryKey: commentsQueryKey })

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      setDraftState({
        statusId,
        value: '',
      })
      invalidateComments()
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }) => updateComment(commentId, content),
    onSuccess: () => {
      setEditingCommentId(null)
      setEditingValue('')
      invalidateComments()
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      setEditingCommentId(null)
      setEditingValue('')
      invalidateComments()
    },
  })

  const upvoteCommentMutation = useMutation({
    mutationFn: upvoteComment,
    onSuccess: () => {
      invalidateComments()
    },
  })

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

  const handleSignOut = async () => {
    try {
      await signOut()
      onNotice?.('Signed out.', 'success')
    } catch (error) {
      onNotice?.(error.message || 'Could not sign out right now.', 'error')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!canLoadComments || !draft.trim()) {
      return
    }

    try {
      await createCommentMutation.mutateAsync({
        status_id: statusId,
        restaurant_key: restaurant.restaurant_key,
        content: draft,
      })
      onNotice?.('Comment posted.', 'success')
    } catch (error) {
      onNotice?.(error.message || 'Could not post your comment right now.', 'error')
    }
  }

  const handleEditSave = async (commentId) => {
    if (!editingValue.trim()) {
      onNotice?.('Comment text is required.', 'error')
      return
    }

    try {
      await updateCommentMutation.mutateAsync({
        commentId,
        content: editingValue,
      })
      onNotice?.('Comment updated.', 'success')
    } catch (error) {
      onNotice?.(
        error.message || 'Could not update this comment right now.',
        'error'
      )
    }
  }

  const handleDelete = async (commentId) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Delete this comment?')

      if (!confirmed) {
        return
      }
    }

    try {
      await deleteCommentMutation.mutateAsync(commentId)
      onNotice?.('Comment deleted.', 'success')
    } catch (error) {
      onNotice?.(
        error.message || 'Could not delete this comment right now.',
        'error'
      )
    }
  }

  const handleUpvote = async (commentId) => {
    if (!isAuthenticated) {
      await handleSignIn()
      return
    }

    try {
      await upvoteCommentMutation.mutateAsync(commentId)
    } catch (error) {
      onNotice?.(error.message || 'Could not upvote this comment right now.', 'error')
    }
  }

  const toggleCommentExpansion = (commentId) => {
    setExpandedComments((currentState) => ({
      ...currentState,
      [commentId]: !currentState[commentId],
    }))
  }

  if (!canLoadComments) {
    return (
      <section
        ref={sectionRef}
        className="rounded-[20px] border border-white/10 bg-white/5 p-4"
      >
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
  const helperRowClass = compact
    ? 'flex flex-col gap-2.5'
    : 'flex items-center justify-between gap-3'
  const helperTextClass = compact
    ? 'max-w-full text-[0.72rem] leading-5 text-slate-300/55'
    : 'text-xs text-slate-300/55'
  const commentListClass = compact ? 'mt-4 space-y-2.5' : 'mt-5 space-y-3'
  const authSummary =
    isAuthenticated && viewer
      ? `Signed in as ${viewer.label}`
      : 'Sign in with Google to post, edit, delete, and upvote comments.'

  return (
    <section
      ref={sectionRef}
      className={`rounded-[20px] border border-white/10 bg-white/5 ${sectionPadding}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-slate-300/55">
            Community comments
          </div>
          <div className={summaryTextClass}>
            {!hasEnteredView
              ? 'Comments load when you reach this section.'
              : comments.length === 0
              ? 'No comments yet. Add the first one.'
              : `Showing ${comments.length} recent ${comments.length === 1 ? 'comment' : 'comments'}.`}
          </div>
        </div>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleSignOut}
            className="shrink-0 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-200/72 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        ) : null}
      </div>

      <div className={`mt-3 ${helperTextClass}`}>{authSummary}</div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            rows={4}
            maxLength={2000}
            value={draft}
            onChange={(event) =>
              setDraftState({
                statusId,
                value: event.target.value,
              })
            }
            placeholder="Add a local tip using safe markdown. Try **bold**, lists, links, blockquotes, or `inline code`."
            className="min-h-28 w-full rounded-[18px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white placeholder:text-slate-300/35 focus:border-white/18 focus:outline-none focus:ring-2 focus:ring-white/12"
          />
          <div className={helperRowClass}>
            <div className={helperTextClass}>
              Safe markdown only: bold, italic, lists, links, blockquotes, line
              breaks, and inline code.
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
      ) : (
        <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-white/10 bg-white/6 px-4 py-4">
          <p className="text-sm leading-6 text-slate-300/76">
            Comments stay public, but community actions now use Google sign-in to
            reduce spam and make ownership clear.
          </p>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={!isReady || isSigningIn}
            className="self-start rounded-[16px] bg-[linear-gradient(135deg,#ffd2a6,#ff7a45)] px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_14px_28px_rgba(255,122,69,0.22)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
          >
            {isSigningIn ? 'Redirecting...' : 'Sign in with Google'}
          </button>
        </div>
      )}

      <div className={commentListClass}>
        {!hasEnteredView ? (
          <div className="rounded-[18px] border border-dashed border-white/12 bg-white/4 px-4 py-4 text-sm text-slate-300/68">
            Scroll a little further to load comments.
          </div>
        ) : commentsQuery.isLoading ? (
          <div className="rounded-[18px] border border-white/10 bg-white/6 px-4 py-4 text-sm text-slate-300/70">
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-[18px] border border-dashed border-white/12 bg-white/4 px-4 py-4 text-sm text-slate-300/68">
            This place does not have any comments yet.
          </div>
        ) : (
          comments.map((comment) => {
            const isVoting =
              upvoteCommentMutation.isPending &&
              upvoteCommentMutation.variables === comment.id
            const isEditing = editingCommentId === comment.id
            const isDeleting =
              deleteCommentMutation.isPending &&
              deleteCommentMutation.variables === comment.id
            const isExpanded = Boolean(expandedComments[comment.id])
            const isCollapsible = shouldCollapseComment(comment)

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
                      {comment.is_edited ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-white/20" />
                          <span>edited</span>
                        </>
                      ) : null}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-3">
                        <textarea
                          rows={4}
                          maxLength={2000}
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          className="min-h-28 w-full rounded-[18px] border border-white/10 bg-[rgba(9,15,32,0.45)] px-4 py-3 text-sm text-white placeholder:text-slate-300/35 focus:border-white/18 focus:outline-none focus:ring-2 focus:ring-white/12"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditSave(comment.id)}
                            disabled={updateCommentMutation.isPending}
                            className="rounded-[14px] bg-[linear-gradient(135deg,#ffd2a6,#ff7a45)] px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-55"
                          >
                            {updateCommentMutation.isPending
                              ? 'Saving...'
                              : 'Save'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommentId(null)
                              setEditingValue('')
                            }}
                            className="rounded-[14px] border border-white/10 bg-white/6 px-3.5 py-2 text-sm font-semibold text-slate-200/78 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <div
                          className={`relative ${
                            isCollapsible && !isExpanded ? 'max-h-32 overflow-hidden' : ''
                          }`}
                        >
                          <CommentMarkdown
                            content={comment.content}
                            compact={compact}
                          />
                          {isCollapsible && !isExpanded ? (
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-[linear-gradient(180deg,rgba(11,17,34,0),rgba(11,17,34,0.96))]" />
                          ) : null}
                        </div>

                        {isCollapsible ? (
                          <button
                            type="button"
                            onClick={() => toggleCommentExpansion(comment.id)}
                            className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)] transition hover:text-white"
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        ) : null}

                        {comment.is_own_comment ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingValue(comment.content)
                              }}
                              className="rounded-[14px] border border-white/10 bg-white/6 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-slate-200/72 transition hover:border-white/18 hover:bg-white/10 hover:text-white"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              disabled={isDeleting}
                              className="rounded-[14px] border border-rose-300/18 bg-rose-400/10 px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-rose-100 transition hover:border-rose-300/28 hover:bg-rose-400/16 disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpvote(comment.id)}
                    aria-label={getVoteButtonLabel(
                      comment,
                      isVoting,
                      isAuthenticated
                    )}
                    title={getVoteButtonLabel(comment, isVoting, isAuthenticated)}
                    disabled={
                      isVoting ||
                      comment.viewer_has_upvoted ||
                      comment.is_own_comment ||
                      !isReady
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

      {hasEnteredView && commentsQuery.hasNextPage ? (
        <button
          type="button"
          onClick={() => commentsQuery.fetchNextPage()}
          disabled={commentsQuery.isFetchingNextPage}
          className="mt-4 rounded-[16px] border border-white/10 bg-white/6 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:border-white/18 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {commentsQuery.isFetchingNextPage ? 'Loading more...' : 'Load more comments'}
        </button>
      ) : null}
    </section>
  )
}
