'use client'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Wishlist } from '@/shared/types'
import { Check, Copy } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import React, { useState } from 'react'

const isDev = process.env.NODE_ENV === 'development'

type Props = {
  wishlist: Wishlist
  open: boolean
  onClose: () => void
}

export function ShareSheet({ wishlist, open, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://get-my-wishlist.ru'
  const shareUrl = `${base}/${wishlist.userId}/${wishlist.id}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available (non-HTTPS or permission denied)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Поделиться вишлистом</SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* URL row */}
          <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
            <span className="flex-1 text-sm font-mono text-muted-foreground truncate">
              {shareUrl}
            </span>
            <Button size="sm" variant="ghost" onClick={handleCopy} className="shrink-0">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Скопировано' : 'Копировать'}
            </Button>
          </div>

          {/* QR */}
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-xl">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          </div>

          {/* Dev env badge */}
          {isDev && (
            <div className="flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400 px-3 py-2 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
              dev · {base}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
