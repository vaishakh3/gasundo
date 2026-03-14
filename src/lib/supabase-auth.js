import 'server-only'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { buildAuthenticatedViewer } from './auth-viewer.js'
import { getSupabasePublicConfig } from './supabase-env.js'

export class AuthRequiredError extends Error {
  constructor(message = 'Sign in with Google to continue.') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

export async function createSupabaseAuthServerClient() {
  const config = getSupabasePublicConfig()

  if (!config) {
    return null
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Server components can be read-only. Route handlers still persist cookies.
        }
      },
    },
  })
}

export async function getAuthenticatedViewer() {
  const supabase = await createSupabaseAuthServerClient()

  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Failed to load authenticated viewer:', error)
    return null
  }

  return buildAuthenticatedViewer(data.user)
}

export async function requireAuthenticatedViewer(message) {
  const viewer = await getAuthenticatedViewer()

  if (!viewer) {
    throw new AuthRequiredError(message)
  }

  return viewer
}
