'use client'

import { useApiCreateConstructorWishlist, useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { LayoutTemplate, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const { mutate: createConstructor, isPending } = useApiCreateConstructorWishlist()
  const router = useRouter()
  const wishlists = data?.data ?? []

  const handleCreate = () => {
    createConstructor(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            router.push(`/wishlist/edit/${res.data.id}`)
          }
        },
      }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-4xl">Мои вишлисты</h2>
        <Button onClick={handleCreate} disabled={isPending}>
          {isPending ? (
            <Loader2 className="mr-2 animate-spin" size={18} />
          ) : (
            <LayoutTemplate className="mr-2" size={18} />
          )}
          Создать вишлист
        </Button>
      </div>

      {wishlists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="text-6xl">🎁</div>
          <h3 className="text-xl font-semibold">Пока нет вишлистов</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Создай первый вишлист и поделись им с теми, кто хочет сделать тебе подарок
          </p>
          <Button onClick={handleCreate} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
            Создать первый вишлист
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlists.map((wishlist) => (
            <WishlistCard key={wishlist.id} wishlist={wishlist} />
          ))}
        </div>
      )}
    </div>
  )
}
