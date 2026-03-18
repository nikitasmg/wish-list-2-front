'use client'

import { Logo } from '@/components/logo'
import Link from 'next/link'
import React from 'react'

const NAV_LINKS = [
  { label: 'Как это работает', href: '/how-it-works' },
  { label: 'Примеры вишлистов', href: '/wishlist-for' },
  { label: 'Блог', href: '/blog' },
]

const LEGAL_LINKS = [
  { label: 'Пользовательское соглашение', href: '/terms-of-service' },
]

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-secondary/50 text-secondary-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-2">
            <Logo />
            <p className="text-xs text-muted-foreground">
              Сервис вишлистов — с 2025 года
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Навигация
            </span>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Legal */}
          <nav className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
              Информация
            </span>
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-foreground/70 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 pt-4 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Просто намекни. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  )
}
