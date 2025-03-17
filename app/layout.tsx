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
  subsets: [ 'latin' ],
})

export const metadata: Metadata = {
  title: 'Get wishlist - Бесплатный сервис по созданию вишлистов',
  description: 'Создай свой вишлист и делись с друзьями',
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
