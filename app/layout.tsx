import { Metrika } from '@/components/metrica'
import { Suspense } from 'react'
import * as React from 'react'
import { GoogleTagManager } from '@next/third-parties/google'
import Providers from '@/app/providers'
import { Toaster } from '@/components/ui/toaster'
import { CookieBanner } from '@/components/cookie-banner'
import type { Metadata } from 'next'
import { Comfortaa, Cormorant_Garamond, Manrope, Oswald, Playfair_Display, Unbounded } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  // Кириллица нужна явно: без неё Manrope подгружается только для латиницы,
  // а русский текст отваливается на системный шрифт.
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700', '800'],
})

/*
 * Шрифты заголовков из «Оформления». Без preload: они нужны только на
 * страницах вишлистов, и браузер скачивает файл, лишь когда шрифт реально
 * применён, — остальные страницы за них не платят.
 */
const unbounded = Unbounded({ variable: '--font-unbounded', subsets: ['latin', 'cyrillic'], weight: ['700', '800'], preload: false })
const comfortaa = Comfortaa({ variable: '--font-comfortaa', subsets: ['latin', 'cyrillic'], weight: ['700'], preload: false })
const oswald = Oswald({ variable: '--font-oswald', subsets: ['latin', 'cyrillic'], weight: ['600', '700'], preload: false })
const cormorant = Cormorant_Garamond({ variable: '--font-cormorant', subsets: ['latin', 'cyrillic'], weight: ['600', '700'], preload: false })
const playfair = Playfair_Display({ variable: '--font-playfair', subsets: ['latin', 'cyrillic'], weight: ['700', '800'], preload: false })

export const metadata: Metadata = {
  metadataBase: new URL('https://prosto-namekni.ru'),
  title: {
    default: 'Просто намекни — Создай вишлист и отправь ссылку',
    template: '%s | Просто намекни',
  },
  description: 'Создай красивый вишлист онлайн и просто отправь ссылку друзьям. Бесплатно, без скачиваний.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://prosto-namekni.ru',
    siteName: 'Просто намекни',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
    <body
      className={`${manrope.variable} ${unbounded.variable} ${comfortaa.variable} ${oswald.variable} ${cormorant.variable} ${playfair.variable} antialiased`}
    >
    <Suspense fallback={null}>
      <Metrika />
    </Suspense>
    <GoogleTagManager gtmId="GTM-K4T9P9B5" />
    <Providers>
      {children}
    </Providers>
    <Toaster />
    <CookieBanner />
    </body>
    </html>
  )
}
