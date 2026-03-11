'use client'

import { useApiCreateConstructorWishlist, useApiGetAllWishlists } from '@/api/wishlist'
import { WishlistCard } from '@/app/wishlist/components/wishlist-card'
import { Button } from '@/components/ui/button'
import { Gift, LayoutTemplate, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { data } = useApiGetAllWishlists()
  const { mutate: createConstructor, isPending } = useApiCreateConstructorWishlist()
  const router = useRouter()

  const handleCreateConstructor = () => {
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
      <h2 className="text-4xl mb-5">Мои вишлисты</h2>
      <div className="flex gap-3 mb-6">
        <Button asChild variant="default">
          <Link href="/wishlist/create">
            <Gift className="mr-2" size={18} />
            Обычный вишлист
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={handleCreateConstructor}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 animate-spin" size={18} />
          ) : (
            <LayoutTemplate className="mr-2" size={18} />
          )}
          Конструктор
        </Button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        {data?.data?.map((wishlist) => (
          <WishlistCard key={wishlist.id} wishlist={wishlist} />
        ))}
      </div>
    </div>
  )
}
