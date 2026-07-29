import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get hostname of request (e.g. app.zotheka.xyz, zotheka.xyz, localhost:3000)
  const hostname = req.headers.get('host') || '';

  // Check if it's the app subdomain (or local dev equivalent)
  const isAppSubdomain = hostname === 'app.zotheka.xyz' || hostname.startsWith('app.localhost');

  if (isAppSubdomain) {
    // If the path doesn't already start with /app (to prevent infinite loops)
    // and it's not an API or static file request
    if (!url.pathname.startsWith('/app') && !url.pathname.startsWith('/api') && !url.pathname.includes('.')) {
      // Rewrite the URL to point to the /app folder internally
      return NextResponse.rewrite(new URL(`/app${url.pathname}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
