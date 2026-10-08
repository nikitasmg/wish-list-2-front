import type { Metadata } from 'next'
import type * as React from 'react'
import { SantaHeader } from './components/santa-header'

export const metadata: Metadata = {
  title: {
    default: 'Тайный Санта онлайн — жеребьёвка без бумажек',
    template: '%s | Тайный Санта',
  },
  description: 'Соберите друзей или коллег в комнату: каждый напишет пожелания, а мы тайно распределим, кто кому дарит.',
  applicationName: 'Тайный Санта — Просто намекни',
  openGraph: { siteName: 'Просто намекни', locale: 'ru_RU', type: 'website' },
}

export default function SantaLayout({ children }: { children: React.ReactNode }) {
  // Санта всегда ночной, какой бы ни была тема сайта: «dark» включает
  // dark:-варианты компонентов, «santa» задаёт цвета.
  return (
    <div className="dark santa min-h-svh bg-background text-foreground">
      <SantaHeader />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-16">{children}</main>
    </div>
  )
}
