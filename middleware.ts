import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get('role')?.value;

  // Admin routes — require role=admin cookie
  if (pathname.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Client routes — require role=client cookie
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/bookings')) {
    if (role !== 'client') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/bookings/:path*'],
};
