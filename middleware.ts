import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

// 保护这些路由，需要登录才能访问
export const config = {
  matcher: ['/videos/:path*', '/admin/:path*', '/profile/:path*'],
}
