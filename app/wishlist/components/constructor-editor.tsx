// app/wishlist/components/constructor-editor.tsx
'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { ConstructorHeader } from '@/app/wishlist/components/constructor/constructor-header'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { Eye, Pencil } from 'lucide-react'

type Props = {
  wishlist: Wishlist
}

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<'editor' | 'preview'>('editor')

  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleBlocksChange = useCallback(
    (blocks: Block[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        mutate(blocks, {
          onError: () => {
            toast({ title: 'Ошибка сохранения блоков', variant: 'destructive' })
          },
        })
      }, 500)
    },
    [mutate, toast]
  )

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('editor')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'editor'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <Pencil size={14} /> Редактор
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          <Eye size={14} /> Превью
        </button>
      </div>

      {mode === 'editor' ? (
        <div className="space-y-6">
          <ConstructorHeader wishlist={wishlist} />
          <BlockCanvas
            initialBlocks={wishlist.blocks ?? []}
            onBlocksChange={handleBlocksChange}
          />
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={false} />
        </div>
      )}
    </div>
  )
}
