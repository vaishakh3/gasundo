'use client'

import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

import { buildAuthenticatedViewer } from '@/lib/auth-viewer'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const AuthContext = createContext({
  viewer: null,
  isAuthenticated: false,
  isReady: false,
  isSigningIn: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

function shouldRefreshQuery(queryKey) {
  return queryKey?.[0] === 'status-snapshot' || queryKey?.[0] === 'restaurant-comments'
}

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({
  children,
  supabaseUrl = null,
  supabaseAnonKey = null,
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [supabase] = useState(() =>
    supabaseUrl && supabaseAnonKey
      ? createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey)
      : null
  )
  const [viewer, setViewer] = useState(null)
  const [isReady, setIsReady] = useState(() => !supabase)
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!supabase) {
      return undefined
    }

    let isMounted = true

    const syncViewer = (nextUser) => {
      if (!isMounted) {
        return
      }

      setViewer(buildAuthenticatedViewer(nextUser))
      setIsReady(true)
      setIsSigningIn(false)
      queryClient.invalidateQueries({
        predicate: (query) => shouldRefreshQuery(query.queryKey),
      })
      startTransition(() => router.refresh())
    }

    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to hydrate auth viewer:', error)
          syncViewer(null)
          return
        }

        syncViewer(data.user)
      })
      .catch((error) => {
        console.error('Failed to read auth session:', error)
        syncViewer(null)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncViewer(session?.user || null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [queryClient, router, supabase])

  const value = useMemo(
    () => ({
      viewer,
      isAuthenticated: Boolean(viewer),
      isReady,
      isSigningIn,
      async signInWithGoogle(nextUrl) {
        if (!supabase || typeof window === 'undefined') {
          throw new Error('Authentication is temporarily unavailable.')
        }

        const callbackUrl = new URL('/auth/callback', window.location.origin)
        callbackUrl.searchParams.set('next', nextUrl || window.location.href)
        setIsSigningIn(true)

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: callbackUrl.toString(),
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        })

        if (error) {
          setIsSigningIn(false)
          throw error
        }

        if (data?.url) {
          window.location.assign(data.url)
        }
      },
      async signOut() {
        if (!supabase) {
          return
        }

        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }

        setViewer(null)
        queryClient.invalidateQueries({
          predicate: (query) => shouldRefreshQuery(query.queryKey),
        })
        startTransition(() => router.refresh())
      },
    }),
    [isReady, isSigningIn, queryClient, router, supabase, viewer]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
