// app/wishlist/components/constructor/constructor-header.tsx
'use client'

import { useApiUpdateConstructorMeta } from '@/api/wishlist'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { colorSchema } from '@/shared/constants'
import { Wishlist } from '@/shared/types'
import React, { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  wishlist: Wishlist
}

export function ConstructorHeader({ wishlist }: Props) {
  const { mutate } = useApiUpdateConstructorMeta(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const [title, setTitle] = useState(wishlist.title)
  const [showSettings, setShowSettings] = useState(false)
  const [colorScheme, setColorScheme] = useState(wishlist.settings.colorScheme)
  const [showGiftAvailability, setShowGiftAvailability] = useState(
    wishlist.settings.showGiftAvailability
  )
  const [presentsLayout, setPresentsLayout] = useState(
    wishlist.settings.presentsLayout ?? 'list'
  )

  const saveMeta = (overrides: {
    title?: string
    colorScheme?: string
    showGiftAvailability?: boolean
    presentsLayout?: string
    coverFile?: File | null
    coverUrl?: string | null
  } = {}) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const fd = new FormData()
      fd.append('title', overrides.title ?? title)
      fd.append('settings[colorScheme]', overrides.colorScheme ?? colorScheme)
      fd.append('settings[showGiftAvailability]', String(overrides.showGiftAvailability ?? showGiftAvailability))
      fd.append('settings[presentsLayout]', overrides.presentsLayout ?? presentsLayout)
      if (overrides.coverFile) {
        fd.append('file', overrides.coverFile)
      } else if (overrides.coverUrl) {
        fd.append('cover_url', overrides.coverUrl)
      } else if (wishlist.cover) {
        fd.append('cover_url', wishlist.cover)
      }
      mutate(fd, {
        onError: () => toast({ title: 'Ошибка сохранения', variant: 'destructive' }),
      })
    }, 600)
  }

  useEffect(() => { setTitle(wishlist.title) }, [wishlist.title])
  useEffect(() => { setColorScheme(wishlist.settings.colorScheme) }, [wishlist.settings.colorScheme])
  useEffect(() => { setShowGiftAvailability(wishlist.settings.showGiftAvailability) }, [wishlist.settings.showGiftAvailability])
  useEffect(() => { setPresentsLayout(wishlist.settings.presentsLayout ?? 'list') }, [wishlist.settings.presentsLayout])

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4 mb-6">
      <div>
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">Название</p>
        <input
          className="w-full text-2xl font-bold bg-transparent border-0 border-b border-dashed border-border focus:border-primary focus:outline-none pb-1 transition-colors"
          value={title}
          placeholder="Новый вишлист"
          onChange={(e) => {
            setTitle(e.target.value)
            saveMeta({ title: e.target.value })
          }}
        />
      </div>

      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
        onClick={() => setShowSettings((v) => !v)}
      >
        {showSettings ? 'Скрыть настройки ↑' : 'Настройки ↓'}
      </button>

      {showSettings && (
        <div className="space-y-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <Label>Цветовая схема</Label>
            <Select
              value={colorScheme}
              onValueChange={(v) => {
                setColorScheme(v)
                saveMeta({ colorScheme: v })
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите цветовую схему" />
              </SelectTrigger>
              <SelectContent>
                {colorSchema.map(({ value, name, colors }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center justify-between gap-4">
                      <span>{name}</span>
                      <div className="flex items-center gap-2">
                        {colors.map((color) => (
                          <div key={color} className="w-[40px] h-[20px]" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Раскладка подарков</Label>
            <Select
              value={presentsLayout}
              onValueChange={(v) => {
                setPresentsLayout(v)
                saveMeta({ presentsLayout: v })
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Список</SelectItem>
                <SelectItem value="grid2">Сетка 2 колонки</SelectItem>
                <SelectItem value="grid3">Сетка 3 колонки</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Показывать забронированные подарки</Label>
            <Switch
              checked={showGiftAvailability}
              onCheckedChange={(v) => {
                setShowGiftAvailability(v)
                saveMeta({ showGiftAvailability: v })
              }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Сохраняется автоматически</p>
    </div>
  )
}
