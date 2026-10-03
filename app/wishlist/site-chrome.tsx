'use client'

import { Header } from '@/components/header'
import { usePathname } from 'next/navigation'
import * as React from 'react'

/**
 * Шапка сайта и поля вокруг страниц кабинета. Конструктор живёт во весь
 * экран со своей шапкой — сайтовая над ней только отнимала бы высоту и
 * просвечивала бы сквозь холст.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname?.startsWith('/wishlist/edit/')) return <>{children}</>
  return (
    <>
      <Header />
      <div className="p-5 max-w-[90rem] mx-auto">
        {children}
      </div>
    </>
  )
}
