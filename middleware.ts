import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Извлекаем cookie
  const token = req.cookies.get('token');

  // Проверяем наличие токена
  if (!token) {
    // Если токен отсутствует, редиректим на страницу /login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Если токен есть, продолжаем обработку запроса
  return NextResponse.next();
}

// Указать, для каких путей применить middleware
export const config = {
  matcher: ['/wishlist/:path*'], // замените на ваши пути
};
