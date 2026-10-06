'use client'

import { rememberNext } from '@/shared/auth-next'
import { useEffect } from 'react'

/** Ставится на страницу входа: запоминает, куда вернуть человека. */
export function RememberNext() {
  useEffect(() => {
    rememberNext(new URLSearchParams(window.location.search).get('next'))
  }, [])
  return null
}
