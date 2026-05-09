import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const isZonalPath = pathname.match(/^\/(chennai|banglore|hydrabad|combatore|dubai|pune)(\/.*)?$/);
  
  if (isZonalPath) {
    const mappedPath = isZonalPath[2] || '/dashboard';
    const url = request.nextUrl.clone();
    url.pathname = mappedPath;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/:zonal(chennai|banglore|hydrabad|combatore|dubai|pune)/:path*'],
}
