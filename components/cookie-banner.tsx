"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem("cookie_consent")) {
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem("cookie_consent", "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-background/95 backdrop-blur-sm",
        "px-4 py-3 shadow-[0_-4px_12px_hsl(var(--border)/0.3)]",
        "animate-in slide-in-from-bottom duration-300"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <span className="text-lg">🍪</span>
        <p className="flex-1 text-sm text-muted-foreground">
          Мы используем куки для аналитики и улучшения работы сайта. Продолжая пользоваться сайтом, вы соглашаетесь с этим.
        </p>
        <Button size="sm" onClick={dismiss} className="shrink-0">
          Понятно
        </Button>
      </div>
    </div>
  )
}
