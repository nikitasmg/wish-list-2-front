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
  // Кириллица нужна явно: без неё Manrope подгружается только для латиницы,
  // а русский текст отваливается на системный шрифт.
  subsets: [ 'latin', 'cyrillic' ],
  weight: [ '400', '500', '600', '700', '800' ],
})

export const metadata: Metadata = {
  title: 'Просто намекни — бесплатный сервис для вишлистов',
  description: 'Соберите страницу праздника и список подарков, поделитесь ссылкой с гостями',
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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
