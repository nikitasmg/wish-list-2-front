'use client'

import { useApiAuth } from '@/api/auth'
import { toast } from '@/hooks/use-toast'
import { AuthProps } from '@/shared/types'
import { useSearchParams } from 'next/navigation'

import { Suspense, useEffect } from 'react'

function Auth() {
  const params = useSearchParams()

  const parseAuthParams = (): null | AuthProps => {
    if (!params) return null
    return {
      id: Number(params.get('id')) ?? '',
      first_name: params.get('first_name') ?? '',
      last_name: params.get('last_name') ?? '',
      username: params.get('username') ?? '',
      auth_date: Number(params.get('auth_date')) ?? '',
      photo_url: params.get('photo_url') ?? '',
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
              title: 'Ошибка авторизации',
              duration: 2000, // Показывать 2 секунды
            });
            setTimeout(() => window.location.replace('/login'), 2000);
          }
        })
      }
    }, // eslint-disable-next-line react-hooks/exhaustive-deps
    [])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div>
        Идет авторизация, пожалуйста не перезагружайте страницу...
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    // You could have a loading skeleton as the `fallback` too
    <Suspense>
      <Auth />
    </Suspense>
  )
}
