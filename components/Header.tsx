'use client'
import { useApiGetMe } from '@/api/user'
import { LoginModal } from '@/components/Auth/components/LoginModal'
import { RegistrationModal } from '@/components/Auth/components/RegistrationModal'
import { Logo } from '@/components/Logo'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/ui/mode-toggle'

import * as React from 'react'

export const Header = () => {
  const { data } = useApiGetMe()
  const user = data?.user
  console.log(user)
  return (
    <header className="flex justify-between items-center mb-10">
      <Logo />
      <div className="flex gap-2 items-center">
        <ModeToggle />
        {
          user
            ? <UserAvatar user={user} />
            : <div className="flex gap-2">
              <LoginModal>
                <Button className="max-w-max" variant="ghost" size="sm">
                  Войти
                </Button>
              </LoginModal>
              <RegistrationModal>
                <Button variant="outline" size="sm">
                  Зарегистрироваться
                </Button>
              </RegistrationModal>
            </div>
        }
      </div>
    </header>
  )
}