import { AuthForm } from '@/components/Auth/components/AuthForm'
import { ModalBase } from '@/components/ModalBase'
import * as React from 'react'

type Props = {
  children: React.ReactNode
}

export function LoginModal({ children }: Props) {
  return (
    <ModalBase
      title={'Войти'}
      description={'Укажите ваш логин и пароль'}
      trigger={children}
    >
      <AuthForm isLogin/>
    </ModalBase>
  )
}
