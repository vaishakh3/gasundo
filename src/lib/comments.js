import 'server-only'

import { buildCommentCursorFilter, encodeCommentCursor } from './comment-cursor.js'
import { buildLegacyViewerLabel } from './auth-viewer.js'
import { requireSupabaseAdmin } from './supabase-admin.js'

export const COMMENT_PAGE_SIZE = 20

const COMMENT_SELECT =
  'id, restaurant_key, status_id, author_identity_hash, author_label, content, upvote_count, created_at, updated_at'

function isEditedComment(comment) {
  if (!comment?.created_at || !comment?.updated_at) {
    return false
  }

  return (
    new Date(comment.updated_at).valueOf() - new Date(comment.created_at).valueOf() >
    1000
  )
}

function toCommentRecord(comment, viewerIdentityKey, upvotedCommentIds) {
  if (!comment || typeof comment !== 'object') {
    return null
  }

  const isOwnComment =
    Boolean(viewerIdentityKey) &&
    viewerIdentityKey === comment.author_identity_hash

  return {
    id: comment.id,
    restaurant_key: comment.restaurant_key,
    status_id: comment.status_id,
    content: comment.content,
    upvote_count: Number(comment.upvote_count || 0),
    created_at: comment.created_at || null,
    updated_at: comment.updated_at || null,
    is_edited: isEditedComment(comment),
    author_label: isOwnComment
      ? 'You'
      : comment.author_label || buildLegacyViewerLabel(comment.author_identity_hash),
    is_own_comment: isOwnComment,
    viewer_has_upvoted: upvotedCommentIds.has(comment.id),
  }
}

async function fetchViewerUpvotes(supabase, commentIds, viewerIdentityKey) {
  if (!viewerIdentityKey || commentIds.length === 0) {
    return new Set()
  }

  const { data, error } = await supabase
    .from('restaurant_comment_votes')
    .select('comment_id')
    .eq('voter_identity_hash', viewerIdentityKey)
    .in('comment_id', commentIds)

  if (error) {
    throw error
  }

  return new Set((data || []).map((vote) => vote.comment_id))
}

export async function getStatusThreadById(statusId) {
  const supabase = requireSupabaseAdmin()
  const { data, error } = await supabase
    .from('restaurant_status')
    .select('id, restaurant_key, restaurant_name, status, note')
    .eq('id', statusId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function listRestaurantComments(
  restaurantKey,
  viewerIdentityKey = null,
  options = {}
) {
  const supabase = requireSupabaseAdmin()
  const limit = Number(options.limit || COMMENT_PAGE_SIZE)
  const cursorFilter = buildCommentCursorFilter(options.cursor)
  let query = supabase
    .from('restaurant_comments')
    .select(COMMENT_SELECT)
    .eq('restaurant_key', restaurantKey)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (cursorFilter) {
    query = query.or(cursorFilter)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  const commentRows = data || []
  const hasMore = commentRows.length > limit
  const pageRows = hasMore ? commentRows.slice(0, limit) : commentRows
  const upvotedCommentIds = await fetchViewerUpvotes(
    supabase,
    pageRows.map((comment) => comment.id),
    viewerIdentityKey
  )

  return {
    comments: pageRows
      .map((comment) =>
        toCommentRecord(comment, viewerIdentityKey, upvotedCommentIds)
      )
      .filter(Boolean),
    nextCursor: hasMore ? encodeCommentCursor(pageRows[pageRows.length - 1]) : null,
    hasMore,
  }
}

export async function createStatusComment({
  statusId,
  restaurantKey,
  content,
  authorIdentityHash,
  authorLabel,
}) {
  const supabase = requireSupabaseAdmin()

  const { data, error } = await supabase
    .from('restaurant_comments')
    .insert([
      {
        status_id: statusId,
        restaurant_key: restaurantKey,
        author_identity_hash: authorIdentityHash,
        author_label: authorLabel,
        content,
      },
    ])
    .select(COMMENT_SELECT)
    .single()

  if (error) {
    throw error
  }

  return toCommentRecord(data, authorIdentityHash, new Set())
}

export async function updateStatusComment({
  commentId,
  content,
  authorIdentityHash,
}) {
  const supabase = requireSupabaseAdmin()
  const { data, error } = await supabase
    .from('restaurant_comments')
    .update({ content })
    .eq('id', commentId)
    .eq('author_identity_hash', authorIdentityHash)
    .select(COMMENT_SELECT)
    .maybeSingle()

  if (error) {
    throw error
  }

  return toCommentRecord(data, authorIdentityHash, new Set())
}

export async function deleteStatusComment({ commentId, authorIdentityHash }) {
  const supabase = requireSupabaseAdmin()
  const { data, error } = await supabase
    .from('restaurant_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_identity_hash', authorIdentityHash)
    .select('id')
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export async function upvoteComment(commentId, viewerIdentityKey) {
  const supabase = requireSupabaseAdmin()
  const { data, error } = await supabase.rpc('add_restaurant_comment_upvote', {
    target_comment_id: commentId,
    voter_identity_hash: viewerIdentityKey,
  })

  if (error) {
    throw error
  }

  return data
}

export async function getCommentById(commentId, viewerIdentityKey = null) {
  const supabase = requireSupabaseAdmin()
  const { data, error } = await supabase
    .from('restaurant_comments')
    .select(COMMENT_SELECT)
    .eq('id', commentId)
    .maybeSingle()

  if (error) {
    throw error
  }

  const upvotedCommentIds = await fetchViewerUpvotes(
    supabase,
    data?.id ? [data.id] : [],
    viewerIdentityKey
  )

  return toCommentRecord(data, viewerIdentityKey, upvotedCommentIds)
}
