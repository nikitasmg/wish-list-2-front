import Link from 'next/link'
import React from 'react'

/**
 * Логотип-леттеринг.
 *
 * Раньше это были два PNG, которые переключались классами при смене темы:
 * картинка не тянулась под размер, мылила на ретине и требовала отдельного
 * файла на каждую тему. Текстом он наследует и цвет, и гарнитуру страницы.
 */
export const Logo = ({ className }: { className?: string }) => {
  return (
    <Link
      href="/"
      aria-label="Просто намекни — на главную"
      className={`flex flex-col leading-none text-foreground ${className ?? ''}`}
    >
      <span className="text-[10px] uppercase tracking-[0.06em] text-muted-foreground">
        просто
      </span>
      <span className="text-[19px] font-extrabold tracking-tight">
        намекни<span className="text-primary">;)</span>
      </span>
    </Link>
  )
}
