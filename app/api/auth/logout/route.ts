import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieNames = ['__Secure-next-auth.session-token', 'next-auth.session-token'];
  for (const name of cookieNames) {
    response.cookies.set({
      name,
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}
