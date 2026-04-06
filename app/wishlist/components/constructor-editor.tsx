'use client'

import { useApiUpdateWishlistBlocks } from '@/api/wishlist'
import { useApiGetAllPresents } from '@/api/present'
import { BlockCanvas } from '@/app/wishlist/components/constructor/block-canvas'
import { ConstructorHeader } from '@/app/wishlist/components/constructor/constructor-header'
import { CoverSection } from '@/app/wishlist/components/constructor/cover-section'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { Button } from '@/components/ui/button'
import { Block, Wishlist } from '@/shared/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'
import { useToast } from '@/hooks/use-toast'
import { Eye, Pencil, Gift, Plus, CircleHelp } from 'lucide-react'
import { useConstructorTour } from '@/hooks/use-constructor-tour'

type Props = {
  wishlist: Wishlist
}

type Mode = 'editor' | 'preview' | 'presents'

export function ConstructorEditor({ wishlist }: Props) {
  const { mutate } = useApiUpdateWishlistBlocks(wishlist.id)
  const { toast } = useToast()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [mode, setMode] = useState<Mode>('editor')
  const [presentModalOpen, setPresentModalOpen] = useState(false)

  const { data: presentsData } = useApiGetAllPresents(wishlist.id)
  const presents = presentsData?.data ?? []

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const { startTour } = useConstructorTour()

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

  const tabClass = (tab: Mode) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      mode === tab
        ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground hover:bg-accent'
    }`

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="sticky top-[68px] z-40 bg-background/95 backdrop-blur-sm py-2 -mx-5 px-5 border-b border-border/40 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          <button type="button" onClick={() => setMode('editor')} className={tabClass('editor')}>
            <Pencil size={14} /> Редактор
          </button>
          <button type="button" onClick={() => setMode('preview')} className={tabClass('preview')}>
            <Eye size={14} /> Превью
          </button>
          <button data-tour="tab-presents" type="button" onClick={() => setMode('presents')} className={tabClass('presents')}>
            <Gift size={14} /> Подарки
            {presents.length > 0 && (
              <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                {presents.length}
              </span>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={startTour}
          title="Помощь"
          className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <CircleHelp size={16} />
        </button>
      </div>

      {mode === 'editor' && (
        <div className="space-y-6">
          <ConstructorHeader wishlist={wishlist} />
          <CoverSection wishlist={wishlist} />
          <BlockCanvas
            initialBlocks={wishlist.blocks ?? []}
            onBlocksChange={handleBlocksChange}
          />
        </div>
      )}

      <div className={mode === 'preview' ? 'rounded-xl border overflow-hidden' : 'hidden'}>
        <WishlistLanding wishlist={wishlist} presents={presents} isMyWishlist={false} disableBodyTheme />
      </div>

      {mode === 'presents' && (
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setPresentModalOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Добавить подарок
          </Button>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            {presents.map((present) => (
              <PresentCard
                key={present.id}
                present={present}
                wishlistId={wishlist.id}
              />
            ))}
          </div>
          {presents.length === 0 && (
            <p className="text-muted-foreground text-sm">Подарков пока нет. Добавь первый!</p>
          )}
        </div>
      )}

      <PresentModal
        wishlistId={wishlist.id}
        open={presentModalOpen}
        onOpenChange={setPresentModalOpen}
      />
    </div>
  )
}
