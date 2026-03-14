'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import AuthProvider from './AuthProvider'

export default function AppProviders({
  children,
  supabaseUrl = null,
  supabaseAnonKey = null,
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      >
        {children}
      </AuthProvider>
    </QueryClientProvider>
  )
}
