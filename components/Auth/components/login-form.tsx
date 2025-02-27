import { AuthForm } from '@/components/auth-form'
import { TgAuthButton } from '@/components/Auth/components/tg-auth-button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import * as React from 'react'

export function LoginForm({
                            className,
                            ...props
                          }: React.ComponentPropsWithoutRef<'div'>) {

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">С возращением!</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <TgAuthButton />
            </div>
            <div
              className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Или укажите ваш логин и пароль
                </span>
            </div>
            <AuthForm isLogin />
            <div className="text-center text-sm">
              Еще нет аккаунта?{' '}
              <Link href={'/registration'} className="underline underline-offset-4">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      {/*<div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">*/}
      {/*  By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}*/}
      {/*  and <a href="#">Privacy Policy</a>.*/}
      {/*</div>*/}
    </div>
  )
}
