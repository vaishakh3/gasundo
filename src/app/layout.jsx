import './globals.css'

import { Public_Sans, Space_Grotesk } from 'next/font/google'

import AppProviders from '@/components/AppProviders'
import GlobalInfoButton from '@/components/GlobalInfoButton'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import ViewportSync from '@/components/ViewportSync'
import { getSupabasePublicConfig } from '@/lib/supabase-env'
import { Analytics } from '@vercel/analytics/next'

const siteUrl = new URL('https://gasundo.live')
const appThemeColor = '#090f20'

const publicSans = Public_Sans({
  subsets: ['latin'],
  variable: '--font-public-sans',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata = {
  metadataBase: siteUrl,
  applicationName: 'GasUndo',
  title: {
    default: 'Restaurants Open in Kochi Today | GasUndo',
    template: '%s | GasUndo',
  },
  description:
    'GasUndo is a live map showing restaurants open in Kochi during the LPG shortage. Find Kochi restaurant status, limited menu updates, and closures across Ernakulam, Kerala.',
  keywords: [
    'restaurants open in Kochi',
    'Kochi restaurant status',
    'Kochi LPG shortage restaurants',
    'restaurants closed Kochi LPG shortage',
    'restaurants open now Kochi',
    'food places open Kochi',
    'live map restaurants Kochi',
    'Kochi restaurant availability',
    'LPG shortage Kochi restaurants',
    'restaurants running limited menu Kochi',
    'restaurants affected by LPG shortage Kerala',
    'which restaurants are open in Kochi today',
    'Kochi food availability',
    'restaurant closures Kochi LPG shortage',
    'live map of restaurants open in Kochi',
    'restaurants open during LPG shortage Kochi',
    'which restaurants are open in Kochi right now',
    'restaurants affected by LPG shortage in Kochi',
    'map showing restaurants open in Kochi',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'GasUndo | Restaurants Open in Kochi Today',
    description:
      'Track restaurants open in Kochi, limited menu updates, and closures caused by the LPG shortage across Ernakulam, Kerala.',
    url: '/',
    siteName: 'GasUndo',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'GasUndo live map of restaurants open in Kochi',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GasUndo | Restaurants Open in Kochi Today',
    description:
      'Live Kochi restaurant status map for open, limited-menu, and closed restaurants during the LPG shortage.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  category: 'food',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'geo.region': 'IN-KL',
    'geo.placename': 'Kochi, Ernakulam, Kerala',
    'geo.position': '9.9312;76.2673',
    ICBM: '9.9312, 76.2673',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GasUndo Kochi',
    startupImage: [
      { url: '/splash/ipadpro3_splash.png', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2732-2048.jpg', media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/ipadpro2_splash.png', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2388-1668.jpg', media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/ipad_splash.png', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2048-1536.jpg', media: '(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1640-2360.jpg', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2360-1640.jpg', media: '(device-width: 820px) and (device-height: 1180px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1668-2224.jpg', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2224-1668.jpg', media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1620-2160.jpg', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2160-1620.jpg', media: '(device-width: 810px) and (device-height: 1080px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1488-2266.jpg', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2266-1488.jpg', media: '(device-width: 744px) and (device-height: 1133px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1320-2868.jpg', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2868-1320.jpg', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1206-2622.jpg', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2622-1206.jpg', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1260-2736.jpg', media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2736-1260.jpg', media: '(device-width: 420px) and (device-height: 912px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1290-2796.jpg', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2796-1290.jpg', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1179-2556.jpg', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2556-1179.jpg', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1170-2532.jpg', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2532-1170.jpg', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/apple-splash-1284-2778.jpg', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2778-1284.jpg', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/iphonex_splash.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2436-1125.jpg', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/iphonexsmax_splash.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2688-1242.jpg', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/iphonexr_splash.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1792-828.jpg', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/iphoneplus_splash.png', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
      { url: '/splash/apple-splash-2208-1242.jpg', media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)' },
      { url: '/splash/iphone6_splash.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1334-750.jpg', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
      { url: '/splash/apple-splash-640-1136.jpg', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
      { url: '/splash/apple-splash-1136-640.jpg', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)' },
    ],
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: appThemeColor,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  const supabaseConfig = getSupabasePublicConfig()

  return (
    <html lang="en-IN">
      <body
        className={`${publicSans.variable} ${spaceGrotesk.variable} min-h-screen bg-[var(--ink-950)] font-sans text-[var(--text-primary)] antialiased`}
      >
        <ViewportSync />
        <AppProviders
          supabaseUrl={supabaseConfig?.url || null}
          supabaseAnonKey={supabaseConfig?.anonKey || null}
        >
          {children}
        </AppProviders>
        <GlobalInfoButton />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  )
}
