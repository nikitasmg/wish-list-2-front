import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  console.log('Token:', token); // Логируем токен

  if (!token) {
    console.log('Redirecting to /login'); // Логируем редирект
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  // matcher: ['/wishlist/:path*'],
};