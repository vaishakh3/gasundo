'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M12 10.25a.75.75 0 0 1 .75.75v5a.75.75 0 0 1-1.5 0v-5a.75.75 0 0 1 .75-.75Zm0-3.25a.94.94 0 1 1 0 1.88A.94.94 0 0 1 12 7Z"
        fill="currentColor"
      />
      <path
        d="M12 2.75a9.25 9.25 0 1 1 0 18.5 9.25 9.25 0 0 1 0-18.5Zm0 1.5a7.75 7.75 0 1 0 0 15.5 7.75 7.75 0 0 0 0-15.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
      <path
        d="M10.53 5.47a.75.75 0 0 1 0 1.06L5.81 11.25H20a.75.75 0 0 1 0 1.5H5.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function GlobalInfoButton() {
  const pathname = usePathname()
  const isAboutPage = pathname === '/about'

  return (
    <Link
      href={isAboutPage ? '/' : '/about'}
      aria-label={isAboutPage ? 'Back to map' : 'About GasUndo'}
      title={isAboutPage ? 'Back to map' : 'About GasUndo'}
      className="fixed bottom-[calc(var(--app-bottom-offset)+env(safe-area-inset-bottom)+18px)] left-4 z-[1205] flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-[linear-gradient(180deg,rgba(13,19,38,0.94),rgba(9,15,31,0.92))] text-slate-100 shadow-[0_18px_38px_rgba(5,8,22,0.3)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-[rgba(255,210,166,0.34)] hover:text-white lg:bottom-7 lg:left-7"
    >
      {isAboutPage ? <BackIcon /> : <InfoIcon />}
    </Link>
  )
}
