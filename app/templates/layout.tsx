import { Header } from '@/components/header'
import type { Metadata } from 'next'
import * as React from 'react'

export const metadata: Metadata = {
  title: 'Пользовательские шаблоны',
  description: 'Шаблоны вишлистов от сообщества — готовые структуры для быстрого старта. Выбери подходящий и создай свой вишлист.',
  openGraph: {
    title: 'Пользовательские шаблоны | Просто намекни',
    description: 'Шаблоны вишлистов от сообщества — готовые структуры для быстрого старта.',
    url: 'https://prosto-namekni.ru/templates',
  },
}

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}
