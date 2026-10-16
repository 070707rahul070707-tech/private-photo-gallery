import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user is trying to access the albums page
  if (request.nextUrl.pathname.startsWith('/albums')) {
    
    // Check for the secure cookie set by our server action
    const token = request.cookies.get('gallery-auth-token')?.value;

    if (token !== 'authenticated') {
      // If no valid cookie, instantly redirect them back to the login page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

// Only run this middleware on specific routes to save performance
export const config = {
  matcher: ['/albums/:path*'],
};