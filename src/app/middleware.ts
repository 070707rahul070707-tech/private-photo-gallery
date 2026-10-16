import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Protects both the main albums page and individual album pages
  if (path.startsWith('/albums') || path.startsWith('/album')) {
    const token = request.cookies.get('gallery-auth-token')?.value;

    if (token !== 'authenticated') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/albums/:path*', '/album/:path*'],
};