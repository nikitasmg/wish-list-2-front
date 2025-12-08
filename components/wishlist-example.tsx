'use client'

import { useTheme } from 'next-themes'
import React from 'react'

const wishlistThemes = [
  { name: 'Основная', className: '',  darkClassName: '' },
  { name: 'Радужная', className: 'rainbow',  darkClassName: 'dark-rainbow ' },
  { name: 'Синяя', className: 'blue',  darkClassName: 'dark-blue ' },
]

export const WishlistExample = () => {
  return (
    <div className="w-full flex flex-col items-center py-10 gap-12">
      <h2 className="text-4xl font-bold">Выбирайте свою тему оформления!</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full max-w-8xl">
        {wishlistThemes.map((t) => (
          <WishlistPreview key={t.name} theme={t} />
        ))}
      </div>
    </div>
  )
}

const WishlistPreview = ({ theme }: { theme: { name: string; className: string, darkClassName: string } }) => {
  const {theme: systemTheme} = useTheme()
  const isDark = systemTheme === 'dark'

  return (
    <div
      className={`
        rounded-2xl shadow-xl border
        h-[500px]
        flex flex-col gap-6
        transition-all hover:-translate-y-1 hover:shadow-2xl
        bg-card text-card-foreground
      `}
    >
      {/* ТЕМА */}
      <div className={`rounded-xl p-5 flex flex-col gap-4 h-full ${isDark ? theme.darkClassName : theme.className} bg-card text-card-foreground`}>

        {/* Заголовок */}
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-xl">{theme.name}</h3>
          <span className="px-3 py-1 rounded-lg text-xs bg-primary text-primary-foreground">
            preview
          </span>
        </div>

        {/* Линии UI */}
        <div className="flex flex-col gap-3 mt-2">
          <div className="h-3 w-3/4 rounded bg-muted" />
          <div className="h-3 w-1/2 rounded bg-muted" />
        </div>

        {/* Пример списка товаров */}
        <div className="flex flex-col gap-3 mt-4">

          <Item title="Sony WH-1000XM5" price="24 990 ₽" />
          <Item title="Nike Air Force 1" price="12 999 ₽" />
          <Item title="LEGO Technic Bugatti" price="49 990 ₽" />
        </div>

        {/* Кнопки */}
        <div className="mt-auto flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Добавить
          </button>
          <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium">
            В корзину
          </button>
        </div>
      </div>
    </div>
  )
}

const Item = ({ title, price }: { title: string; price: string }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border bg-popover">
    <div className="flex flex-col">
      <span className="font-medium">{title}</span>
      <span className="text-sm text-muted-foreground">{price}</span>
    </div>
    <div className="w-8 h-8 rounded bg-muted" />
  </div>
)
