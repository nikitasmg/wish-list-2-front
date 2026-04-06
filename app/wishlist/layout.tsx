import { Header } from '@/components/header'
import Link from 'next/link'
import * as React from 'react'

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      <div className="p-5 max-w-[90rem] mx-auto">
        <nav className="flex gap-4 mb-6 border-b border-border pb-3">
          <Link
            href="/wishlist"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Мои вишлисты
          </Link>
          <Link
            href="/wishlist/settings"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Настройки
          </Link>
        </nav>
        {children}
      </div>
    </>
  )
}
