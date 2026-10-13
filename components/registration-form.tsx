'use client'

import { useRef, useState } from 'react'
import { AuthForm } from '@/components/auth-form'
import { TgAuthButton } from '@/components/Auth/components/tg-auth-button'
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent, CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Send } from 'lucide-react'
import Link from 'next/link'


export function RegistrationForm({
                            className,
                            ...props
                          }: React.ComponentPropsWithoutRef<"div">) {
  const [consent, setConsent] = useState(false)
  const [missed, setMissed] = useState(false)
  const consentRef = useRef<HTMLInputElement>(null)

  // Согласие нужно для любого способа входа. Кнопки не выключаем: выключенная
  // кнопка не объясняет, чего ей не хватает, — показываем это при нажатии.
  const requireConsent = () => {
    if (consent) return true
    setMissed(true)
    consentRef.current?.focus()
    return false
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-title-sm">Добро пожаловать!</CardTitle>
          <CardDescription>
            Создайте аккаунт
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              {consent ? (
                <TgAuthButton />
              ) : (
                // Виджет Telegram — чужой iframe, нажатие в нём не перехватить:
                // до согласия на его месте своя кнопка, которая просит галочку.
                <Button type="button" variant="outline" className="w-full" onClick={requireConsent}>
                  <Send aria-hidden />Войти через Telegram
                </Button>
              )}
            </div>
            <div className="relative text-center text-body-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Или
              </span>
            </div>
            <AuthForm
              canSubmit={requireConsent}
              beforeSubmit={
                <div className="space-y-1.5">
                  <label className={cn('flex items-start gap-2 text-caption', missed && !consent ? 'text-destructive' : 'text-muted-foreground')}>
                    <input
                      ref={consentRef}
                      type="checkbox"
                      checked={consent}
                      aria-invalid={missed && !consent}
                      aria-describedby={missed && !consent ? 'consent-error' : undefined}
                      onChange={(e) => { setConsent(e.target.checked); setMissed(false) }}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                    />
                    <span>
                      Я принимаю{' '}
                      <Link href="/terms-of-service" target="_blank" className="underline hover:text-primary">
                        Пользовательское соглашение
                      </Link>{' '}
                      и даю согласие на обработку персональных данных в соответствии с{' '}
                      <Link href="/privacy-policy" target="_blank" className="underline hover:text-primary">
                        Политикой конфиденциальности
                      </Link>
                      .
                    </span>
                  </label>
                  {missed && !consent && (
                    <p id="consent-error" role="alert" className="text-caption font-semibold text-destructive">
                      Отметьте согласие — без него аккаунт не создать, ни через Telegram, ни по логину.
                    </p>
                  )}
                </div>
              }
            />
            <div className="text-center text-body-sm">
              Уже есть аккаунт?{" "}
              <Link href={'/login'} className="underline underline-offset-4">
                Войти
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
