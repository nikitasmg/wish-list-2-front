import { AuthForm } from '@/components/Auth/components/AuthForm'
import { ModalBase } from '@/components/ModalBase'
import * as React from 'react'

type Props = {
  children: React.ReactNode
}

export function RegistrationModal({ children }: Props) {
  return (
    <ModalBase
      title={'Регистрация'}
      description={'Введите логин и пароль'}
      trigger={children}
    >
      <AuthForm/>
    </ModalBase>
  )
}
