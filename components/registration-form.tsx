'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth-form'
import { TgAuthButton } from '@/components/Auth/components/tg-auth-button'
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent, CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'


export function RegistrationForm({
                            className,
                            ...props
                          }: React.ComponentPropsWithoutRef<"div">) {
  const [consent, setConsent] = useState(false)

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
            <label className="flex items-start gap-2 text-caption text-muted-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
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
            <div className="flex flex-col gap-4">
              {consent ? (
                <TgAuthButton />
              ) : (
                <div
                  className="w-full min-h-[40px] flex items-center justify-center rounded-control-lg border border-dashed border-border text-caption text-muted-foreground px-3 text-center opacity-60"
                  title="Сначала примите условия выше"
                >
                  Отметьте согласие, чтобы войти через Telegram
                </div>
              )}
            </div>
            <div className="relative text-center text-body-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Или
              </span>
            </div>
            <AuthForm disabled={!consent} />
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
