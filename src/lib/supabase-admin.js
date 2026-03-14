import 'server-only'

import { createClient } from '@supabase/supabase-js'

import { readEnvValue } from './supabase-env.js'

let supabaseAdmin
let warnedFallbackClient = false

export function getSupabaseAdmin() {
  if (supabaseAdmin !== undefined) {
    return supabaseAdmin
  }

  const url = readEnvValue(
    'SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'VITE_SUPABASE_URL'
  )
  const serviceRoleKey = readEnvValue('SUPABASE_SERVICE_ROLE_KEY')
  const anonKey = readEnvValue(
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY'
  )
  const accessKey = serviceRoleKey || anonKey

  if (!url || !accessKey) {
    supabaseAdmin = null
    return supabaseAdmin
  }

  if (!serviceRoleKey && anonKey && !warnedFallbackClient) {
    warnedFallbackClient = true
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY is missing. Falling back to the anon key for server-side Supabase access.'
    )
  }

  supabaseAdmin = createClient(url, accessKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  return supabaseAdmin
}

export function requireSupabaseAdmin() {
  const client = getSupabaseAdmin()

  if (!client) {
    throw new Error('Server is missing Supabase configuration.')
  }

  return client
}
