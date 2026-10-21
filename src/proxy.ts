import { NextResponse, type NextRequest } from 'next/server';
import { isValidVisitorId, newVisitorId, VISITOR_COOKIE } from '@/store/visitor';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

/** Hosted mode only: gives each new visitor an id, visible to this request as well as later ones. */
export function proxy(request: NextRequest) {
  if (process.env.HOSTED !== '1' || isValidVisitorId(request.cookies.get(VISITOR_COOKIE)?.value)) return NextResponse.next();
  const id = newVisitorId();
  request.cookies.set(VISITOR_COOKIE, id);
  const headers = new Headers(request.headers);
  headers.set('cookie', request.cookies.toString());
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: THIRTY_DAYS,
  });
  return response;
}

export const config = {
  // Pages, server actions and API routes; not static files, images or anything with a file extension.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
