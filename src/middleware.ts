import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const session = request.cookies.get('session_id')

    const protectedPaths = ['/app', '/admin']

    const isProtected = protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
    )

    if (isProtected && !session) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/app/:path*', '/admin/:path*'],
}