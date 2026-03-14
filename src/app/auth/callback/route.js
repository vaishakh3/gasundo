import { NextResponse } from 'next/server'

import { getSafeRedirectPath } from '@/lib/auth-redirect'
import { createSupabaseAuthServerClient } from '@/lib/supabase-auth'

function buildRedirectUrl(requestUrl, nextPath, authError = null) {
  const redirectUrl = new URL(nextPath, requestUrl)

  if (authError) {
    redirectUrl.searchParams.set('authError', authError)
  }

  return redirectUrl
}

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const nextPath = getSafeRedirectPath(
    request.url,
    requestUrl.searchParams.get('next')
  )
  const authError =
    requestUrl.searchParams.get('error_description') ||
    requestUrl.searchParams.get('error')
  const code = requestUrl.searchParams.get('code')

  if (authError || !code) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request.url,
        nextPath,
        'Google sign-in could not be completed.'
      )
    )
  }

  const supabase = await createSupabaseAuthServerClient()

  if (!supabase) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request.url,
        nextPath,
        'Authentication is temporarily unavailable.'
      )
    )
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Failed to exchange auth code for session:', error)

    return NextResponse.redirect(
      buildRedirectUrl(
        request.url,
        nextPath,
        'Google sign-in could not be completed.'
      )
    )
  }

  return NextResponse.redirect(buildRedirectUrl(request.url, nextPath))
}
