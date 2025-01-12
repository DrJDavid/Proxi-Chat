import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not /auth/*, redirect to /auth/login
  if (!session && !request.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and the current path is /auth/*, redirect to /chat
  if (session && request.nextUrl.pathname.startsWith('/auth/')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/chat'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images).*)'],
} 