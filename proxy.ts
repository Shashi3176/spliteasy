import { getToken } from 'next-auth/jwt';
import { NextResponse, NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = request.nextUrl;

  const isProtectedPage = pathname.startsWith('/dashboard') || pathname.startsWith('/groups');
  const isAuthPage = pathname === '/signin' || pathname === '/register';

  if (isProtectedPage && !token) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/groups/:path*', '/signin', '/register'],
};
