'use client'

import { useEffect, useRef } from 'react'
import * as React from 'react'

export const TgAuthButton = () => {
  const tgButtonContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', 'Getwishlist_bot')
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-auth-url', 'https://get-my-wishlist.ru/oauth')
    script.setAttribute('data-request-access', 'write')

    tgButtonContainerRef.current?.appendChild(script)

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      tgButtonContainerRef.current?.removeChild(script) // Очистка при размонтировании
    }
  }, [])
  return (
    <div className="w-full min-h-[40px]" ref={tgButtonContainerRef}/>
  )
}