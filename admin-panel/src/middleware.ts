import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    if (pathname.startsWith('/login') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    const session = req.cookies.get('adminSession')?.value;
    if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next|favicon.ico|icon\\.svg|apple-icon).*)'],
};
