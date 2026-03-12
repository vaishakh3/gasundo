import './globals.css'

import { Public_Sans, Space_Grotesk } from 'next/font/google'

import AppProviders from '@/components/AppProviders'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata = {
  title: 'GasUndo Kochi - Live Restaurant Status Map',
  description:
    'GasUndo Kochi is a crowdsourced live map showing which restaurants are open or closed during the LPG shortage in Kochi, India.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GasUndo Kochi',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#090f20',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${spaceGrotesk.variable} min-h-screen bg-[var(--ink-950)] font-sans text-[var(--text-primary)] antialiased`}
      >
        <AppProviders>{children}</AppProviders>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
