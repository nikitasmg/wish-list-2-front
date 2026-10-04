
import Link from 'next/link'

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
      <span className="text-micro uppercase tracking-wider text-muted-foreground">
        просто
      </span>
      <span className="text-title-xs font-extrabold">
        намекни<span className="text-primary">;)</span>
      </span>
    </Link>
  )
}
