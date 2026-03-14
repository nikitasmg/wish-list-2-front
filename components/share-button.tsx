'use client'

import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Copy, Share2 } from 'lucide-react'
import React from 'react'

type Props = {
  title: string
  url: string
  className?: string
}

export function ShareButtons({ title, url, className }: Props) {
  const { toast } = useToast()

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // пользователь отменил — ничего не делаем
      }
    } else {
      await copyToClipboard()
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ title: 'Не удалось скопировать', variant: 'destructive' })
    }
  }

  return (
    <div className={className}>
      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share2 size={14} className="mr-1.5" />
        Поделиться
      </Button>
      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
        <Copy size={14} className="mr-1.5" />
        Скопировать
      </Button>
    </div>
  )
}

export default ShareButtons
