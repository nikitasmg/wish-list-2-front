import { Metrika } from '@/components/metrica'
import { Suspense } from 'react'
import * as React from 'react'
import { GoogleTagManager } from '@next/third-parties/google'
import Providers from '@/app/providers'
import { Toaster } from '@/components/ui/toaster'
import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  variable: '--font-manrope',
  subsets: ['latin', 'cyrillic'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://prosto-namekni.ru'),
  title: {
    default: 'Просто намекни — Создай вишлист и отправь ссылку',
    template: '%s | Просто намекни',
  },
  description: 'Создай красивый вишлист онлайн и просто отправь ссылку друзьям. Бесплатно, без скачиваний.',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://prosto-namekni.ru',
    siteName: 'Просто намекни',
  },
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    yandex: 'REPLACE_WITH_YANDEX_TOKEN',
    google: 'REPLACE_WITH_GOOGLE_TOKEN',
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
      className={`${manrope.variable} antialiased`}
    >
    <Suspense fallback={null}>
      <Metrika />
    </Suspense>
    <GoogleTagManager gtmId="GTM-P7BZ6ZCM" />
    <Providers>
      {children}
    </Providers>
    <Toaster />
    </body>
    </html>
  )
}
