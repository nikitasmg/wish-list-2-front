'use client'

import { useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { LayoutTemplate } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const router = useRouter()
  const wishlists = data?.data ?? []

  const handleCreate = () => {
    router.push('/wishlist/create')
  }

  return (
    <div>
      <div className="flex flex-col gap-2 items-center justify-between mb-6 lg:flex-row">
        <h2 className="text-4xl">Мои вишлисты</h2>
        <Button onClick={handleCreate}>
          <LayoutTemplate className="mr-2" size={18} />
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
          <Button onClick={handleCreate}>
            <LayoutTemplate className="mr-2" size={18} />
            Создать первый вишлист
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {wishlists.map((wishlist) => (
            <WishlistCard key={wishlist.id} wishlist={wishlist} />
          ))}
        </div>
      )}
    </div>
  )
}
