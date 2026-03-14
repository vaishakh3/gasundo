'use client'

import { createBrowserClient } from '@supabase/ssr'

export function createSupabaseBrowserClient(url, anonKey) {
  return createBrowserClient(url, anonKey, {
    auth: {
      flowType: 'pkce',
    },
  })
}
