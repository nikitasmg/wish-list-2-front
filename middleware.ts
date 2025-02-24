// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Проверяем, начинается ли путь с /wishlist
  if (request.nextUrl.pathname.startsWith('/wishlist')) {
    // Получаем куку 'token'
    const token = request.cookies.get('token')?.value;
    console.log(request.cookies.get('token'))
    // Если куки нет, выполняем редирект на /login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Если кука есть или путь не начинается с /wishlist, продолжаем выполнение
  return NextResponse.next();
}

// Конфигурация middleware
export const config = {
  matcher: '/wishlist/:path*', // Применяем middleware только к путям, начинающимся с /wishlist
};