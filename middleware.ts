import { auth } from "@/auth"
import { NextResponse } from "next/server"

export const runtime = 'nodejs'

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user
  const isOnSignIn = req.nextUrl.pathname.startsWith('/auth/signin')
  const isOnUnauthorized = req.nextUrl.pathname.startsWith('/auth/unauthorized')

  // Permitir acceso a la página de no autorizado sin login
  if (isOnUnauthorized) {
    return NextResponse.next()
  }

  if (isOnSignIn) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/', req.nextUrl))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)"],
}
