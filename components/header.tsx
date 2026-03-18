'use client'
import { useApiGetMe } from '@/api/user'
import { Logo } from '@/components/logo'
import { UserAvatar } from '@/components/user-avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { LayoutList, Sparkles } from 'lucide-react'
import * as React from 'react'

export const Header = () => {
  const { data } = useApiGetMe()
  const user = data?.user
  const navigate = useRouter()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handler = () => setIsScrolled(window.scrollY > 0)
    window.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 flex justify-between py-2 items-center px-2 md:px-5 transition-all duration-200 ${
        isScrolled
          ? 'backdrop-blur-md bg-background/80 border-b border-border/50'
          : ''
      }`}
    >
      <Logo />

      {/* Navigation links */}
      <nav className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate.push('/wishlist')}
          className="gap-1.5"
        >
          <LayoutList size={16} />
          <span className="hidden md:inline">Мои вишлисты</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate.push('/wishlist-for')}
          className="gap-1.5"
        >
          <Sparkles size={16} />
          <span className="hidden md:inline">Примеры</span>
        </Button>
      </nav>

      {/* Auth + Theme */}
      <div className="flex gap-2 items-center">
        <ThemeToggle />
        {user ? (
          <UserAvatar user={user} />
        ) : (
          <div className="flex gap-2">
            <Button className="max-w-max" variant="ghost" size="sm" onClick={() => navigate.push('/login')}>
              Войти
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate.push('/registration')}>
              <span className="hidden sm:inline">Зарегистрироваться</span>
              <span className="sm:hidden">Регистрация</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
