'use client'

import { useApiUpdateConstructorMeta } from '@/api/wishlist'
import { getSchemeConfig } from '@/app/s/[shortId]/components/scheme-config'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Wishlist } from '@/shared/types'
import { ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'

type Props = {
  wishlist: Wishlist
}

export function CoverSection({ wishlist }: Props) {
  const { mutate, isPending } = useApiUpdateConstructorMeta(wishlist.id)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const config = getSchemeConfig(wishlist.settings.colorScheme)
  const displayUrl = previewUrl ?? wishlist.cover ?? null

  function buildBaseMeta(): FormData {
    const fd = new FormData()
    fd.append('title', wishlist.title)
    fd.append('settings[colorScheme]', wishlist.settings.colorScheme ?? '')
    fd.append('settings[showGiftAvailability]', String(wishlist.settings.showGiftAvailability))
    fd.append('settings[presentsLayout]', wishlist.settings.presentsLayout ?? 'list')
    return fd
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    const fd = buildBaseMeta()
    fd.append('file', file)
    mutate(fd, {
      onError: () => {
        toast({ title: 'Ошибка сохранения обложки', variant: 'destructive' })
        setPreviewUrl(null)
      },
    })

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  function handleDelete() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    const fd = buildBaseMeta()
    fd.append('cover_url', '')
    mutate(fd, {
      onError: () => toast({ title: 'Ошибка сохранения обложки', variant: 'destructive' }),
    })
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden mb-6">
      <div className="px-6 pt-4 pb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Обложка вишлиста</p>
      </div>

      {/* Preview area */}
      <div className="relative h-48 w-full">
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Обложка вишлиста"
              fill
              unoptimized
              className="object-cover"
            />
            {/* Gradient overlay */}
            <div className={cn('absolute inset-0 bg-gradient-to-t', config.heroOverlay)} />

            {/* Title */}
            <div className="absolute bottom-0 left-0 px-5 pb-4">
              <p className="text-white font-bold text-xl drop-shadow">{wishlist.title}</p>
            </div>

            {/* Action buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/50 text-white hover:bg-black/70 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Изменить
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/50 text-white hover:bg-destructive transition-colors disabled:opacity-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </>
        ) : (
          /* No cover state */
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-primary/30 via-background to-accent/20 border-2 border-dashed border-border cursor-pointer hover:border-primary transition-colors"
            onClick={() => !isPending && fileInputRef.current?.click()}
          >
            {isPending ? (
              <Loader2 size={24} className="text-muted-foreground animate-spin" />
            ) : (
              <>
                <ImageIcon size={32} className="text-muted-foreground" />
                <button
                  type="button"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Upload size={14} />
                  Добавить обложку
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
