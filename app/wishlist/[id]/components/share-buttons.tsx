'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Wishlist } from '@/shared/types'
import { Copy, Share2 } from 'lucide-react'
import * as React from 'react'

type Props = {
  wishlist: Wishlist
}

const getShareUrl = (wishlist: Wishlist) =>
  `https://get-my-wishlist.ru/s/${wishlist.shortId}`

export const ShareButtons = ({ wishlist }: Props) => {
  const handleShare = async () => {
    if (!navigator.share) return
    try {
      await navigator.share({ title: wishlist.title, url: getShareUrl(wishlist) })
    } catch (error) {
      console.error('Share error:', error)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl(wishlist))
      toast({ title: 'Ссылка на вишлист скопирована' })
    } catch {
      toast({ variant: 'destructive', title: 'Не удалось скопировать ссылку. Попробуйте еще раз.' })
    }
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row mb-2">
      <Button size="lg" onClick={handleShare}>Поделиться <Share2 /></Button>
      <Button size="lg" variant="outline" onClick={handleCopy}>Скопировать ссылка <Copy /></Button>
    </div>
  )
}
