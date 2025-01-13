import { Header } from '@/components/header'
import * as React from 'react'

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
    <Providers>
      <div className="p-5">
        {children}
      </div>
    </Providers>
    <Toaster />
    </body>
    </html>
  )
}
