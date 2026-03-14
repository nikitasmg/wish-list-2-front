'use client'
import { useApiGetAllPresents } from '@/api/present'
import { useApiGetWishlistById } from '@/api/wishlist'
import { PresentCard } from '@/app/wishlist/[id]/present/components/present-card'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toDate } from 'date-fns'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useParams } from 'next/navigation'
import * as React from 'react'

export default function Page() {
  const { id } = useParams()
  const [presentModalOpen, setPresentModalOpen] = React.useState(false)

  const { data } = useApiGetWishlistById(id as string)
  const { data: presents } = useApiGetAllPresents(id as string)
  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  return (
    <div className="flex flex-col gap-5">

      <Breadcrumbs items={[ { name: 'Мои вишлисты', url: '/wishlist' } ]} page={wishlist.title} />
      <div className="flex items-center justify-between">
        <h2 className="text-4xl">{wishlist?.title ?? 'День рождения'}</h2>
        <WishlistMenu wishlist={wishlist} />
      </div>
      <div className='flex flex-col-reverse md:flex-row gap-5'>
        {wishlist.description && (
          <Card>
            <CardContent className="text-xl whitespace-pre-wrap mb-5 py-2 px-5">
              {wishlist.description}
            </CardContent>
          </Card>
        )}
        {
          wishlist?.cover &&
          <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" width={400} height={400} unoptimized />
        }
      </div>

      {
        (wishlist.location.name || wishlist.location.time) && (
          <div className='mb-5'>
            <h3 className="text-2xl mb-2">Дата и место:</h3>
            {
              wishlist.location.time && <div>
                Дата - {toDate(wishlist.location.time).toLocaleDateString()}
              </div>
            }
            {
              wishlist.location.name && <div>
                Место - {wishlist.location.link ?
                <a className='text-primary underline' href={wishlist.location.link} rel="nofollow" target="_blank">{wishlist.location.name}</a> :
                <span>{wishlist.location.name}</span>}
              </div>
            }

          </div>
        )
      }
      <h3 className="text-2xl mb-5">Список подарков:</h3>
      <Button
        variant="outline"
        className="w-full border-dashed mb-4"
        onClick={() => setPresentModalOpen(true)}
      >
        <Plus size={16} className="mr-2" />
        Добавить подарок
      </Button>
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
        {presents?.data.map((present) => (
          <PresentCard
            key={present.id}
            wishlistId={id as string}
            present={present}
          />
        ))}
      </div>

      <PresentModal
        wishlistId={id as string}
        open={presentModalOpen}
        onOpenChange={setPresentModalOpen}
      />
    </div>
  )
}