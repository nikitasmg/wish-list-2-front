import Head from 'next/head'
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
    <Head>
      {/* Яндекс.Метрика */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(100150140, "init", {
                   clickmap:true,
                   trackLinks:true,
                   accurateTrackBounce:true
              });
            `,
        }}
      />
      <noscript>
        <div>
          <img src="https://mc.yandex.ru/watch/100150140" style={{ position: 'absolute', left: '-9999px' }} alt="" />
        </div>
      </noscript>
    </Head>
    <body
      className={`${manrope.variable} antialiased`}
    >
    <Providers>
      {children}
    </Providers>
    <Toaster />
    </body>
    </html>
  )
}
