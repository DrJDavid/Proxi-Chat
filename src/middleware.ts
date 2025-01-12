import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's an error getting the session, redirect to login
  if (error) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Auth routes - redirect to chat if already authenticated
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/register') {
    if (session) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
    return res
  }

  // Protected routes - redirect to login if not authenticated
  if (req.nextUrl.pathname.startsWith('/chat')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    return res
  }

  // Root route - redirect to chat if authenticated, login if not
  if (req.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/chat', req.url))
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/', '/login', '/register', '/chat/:path*']
} 