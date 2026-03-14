import { NextResponse } from 'next/server'

const APEX_HOST = 'gasundo.live'
const WWW_HOST = 'www.gasundo.live'

export function proxy(request) {
  if (request.nextUrl.hostname !== APEX_HOST) {
    return NextResponse.next()
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.hostname = WWW_HOST
  redirectUrl.protocol = 'https'

  return NextResponse.redirect(redirectUrl, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
