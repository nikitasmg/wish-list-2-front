'use client'

import { useApiAuth } from '@/api/auth'
import { toast } from '@/hooks/use-toast'
import { AuthProps } from '@/shared/types'
import { useSearchParams } from 'next/navigation'

import { useEffect } from 'react'

export default function LoginPage() {
  const params = useSearchParams()

  const parseAuthParams = (): null | AuthProps => {
    if (!params) return null

    return {
      id: params.get('id') ?? '',
      first_name: params.get('first_name') ?? '',
      username: params.get('username') ?? '',
      auth_date: params.get('auth_date') ?? '',
      hash: params.get('hash') ?? '',
    }
  }
  const { mutate } = useApiAuth()

  useEffect(() => {
      const authData = parseAuthParams()
      if (authData) {
        mutate(authData, {
          onSuccess: () => window.location.replace('/wishlist'),
          onError: () => {
            toast({
              variant: 'destructive',
              title: 'Что-то пошло не так',
            })
            window.location.replace('/login')
          },
        })
      }
    },
    [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div>
        Идет авторизация, пожалуйста не перезагружайте страницу...
      </div>
    </div>
  )
}
