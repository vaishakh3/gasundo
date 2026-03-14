import 'server-only'

export function readEnvValue(...names) {
  for (const name of names) {
    const value = process.env[name]

    if (typeof value !== 'string') {
      continue
    }

    const normalized = value.trim().replace(/^"(.*)"$/, '$1')

    if (normalized) {
      return normalized
    }
  }

  return null
}

export function getSupabasePublicConfig() {
  const url = readEnvValue(
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_URL',
    'VITE_SUPABASE_URL'
  )
  const anonKey = readEnvValue(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY'
  )

  if (!url || !anonKey) {
    return null
  }

  return {
    url,
    anonKey,
  }
}
