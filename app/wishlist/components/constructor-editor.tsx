// app/wishlist/components/constructor-editor.tsx
'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { ConstructorHeader } from '@/app/wishlist/components/constructor/constructor-header'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useEffect, useRef } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'

type Props = {
  wishlist: Wishlist
}

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    <div className="space-y-6">
      <ConstructorHeader wishlist={wishlist} />
      <BlockCanvas
        initialBlocks={wishlist.blocks ?? []}
        onBlocksChange={handleBlocksChange}
      />
    </div>
  )
}
