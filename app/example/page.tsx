'use client'

import { examples, ExampleData } from '@/app/example/data'
import { WishlistLanding } from '@/app/s/[shortId]/components/wishlist-landing'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { colorSchema } from '@/shared/constants'
import * as React from 'react'

function ExampleCoverPlaceholder({ colorScheme }: { colorScheme: string }) {
  const scheme = colorSchema.find((s) => s.value === colorScheme) ?? colorSchema[0]
  const bg = scheme.colors[0] ?? '#ffffff'
  const accent = scheme.colors[1] ?? '#000000'
  return (
    <div
      className="w-full h-[140px] rounded-t-xl"
      style={{
        backgroundImage: [
          `radial-gradient(circle, ${accent}26 1px, transparent 1px)`,
          `linear-gradient(135deg, ${accent}40 0%, ${bg}26 100%)`,
        ].join(', '),
        backgroundSize: '18px 18px, 100% 100%',
        backgroundColor: bg,
      }}
    />
  )
}

function ExampleCard({ data, onOpen }: { data: ExampleData; onOpen: () => void }) {
  return (
    <div className="border rounded-xl shadow hover:shadow-md transition-shadow bg-card flex flex-col">
      <ExampleCoverPlaceholder colorScheme={data.wishlist.settings.colorScheme} />
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-semibold text-base leading-snug">{data.wishlist.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{data.wishlist.description}</p>
        <p className="text-xs text-muted-foreground">{data.presents.length} подарков</p>
        <Button size="sm" className="w-full mt-1" onClick={onOpen}>
          Посмотреть
        </Button>
      </div>
    </div>
  )
}

export default function ExamplePage() {
  const [selected, setSelected] = React.useState<ExampleData | null>(null)

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Примеры вишлистов</h1>
        <p className="text-muted-foreground">
          Посмотри, как выглядят вишлисты для разных поводов — и создай свой
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {examples.map((ex) => (
          <ExampleCard
            key={ex.wishlist.id}
            data={ex}
            onOpen={() => setSelected(ex)}
          />
        ))}
      </div>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => { if (!open) setSelected(null) }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {selected?.wishlist.title ?? 'Пример вишлиста'}
          </DialogTitle>
          {selected && (
            <WishlistLanding
              wishlist={selected.wishlist}
              presents={selected.presents}
              isMyWishlist={false}
              disableBodyTheme
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
