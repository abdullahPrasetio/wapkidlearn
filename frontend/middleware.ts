import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't need auth
const PUBLIC = ['/login', '/child-login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check for refresh_token cookie (presence = logged in)
  // Backend sets HttpOnly cookies; we can only check for their existence
  const hasSession = request.cookies.has('refresh_token')
  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|api/).*)',
  ],
}
