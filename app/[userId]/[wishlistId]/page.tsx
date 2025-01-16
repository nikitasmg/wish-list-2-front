'use client'

import { useApiGetWishlistById } from '@/api/wishlist'
import { PresentsPage } from '@/app/[userId]/[wishlistId]/components/presents-page'
import Image from 'next/image'
import { useParams } from 'next/navigation'

export default function Page() {
  const { wishlistId } = useParams()
  if (!wishlistId) {
    return null
  }
  const { data } = useApiGetWishlistById(wishlistId as string)

  const wishlist = data?.data

  if (!wishlist) {
    return null
  }

  return (
    <div className="dark-blue w-screen min-h-screen bg-background px-2 md:px-5">
      <div className='flex flex-col py-5'>
        <div className="flex flex-col-reverse gap-6 md:flex-row md:justify-between mb-10">
          <div className="text-5xl font-bold text-primary flex flex-col gap-4 justify-between col-auto">
            <div>
              Добро пожаловать в мой вишлист!
            </div>
            <div className="text-4xl text-card-foreground">
              Приглашаю вас на свой праздник -
              <div className="text-primary text-4xl">"{wishlist.title}"</div>
            </div>
          </div>

          {wishlist?.cover &&
            <div className='relative w-full h-[400px]'>
              <Image className="rounded-2xl" src={wishlist.cover} alt="wishlist-cover" fill objectFit='cover'/>
            </div>
          }
        </div>
        {
          wishlist?.description && <div>
            <span className='text-4xl text-primary'>Что вас ждет?</span>
            <div className='text-xl text-foreground'>
              {wishlist?.description}
            </div>
          </div>
        }
      </div>
      <PresentsPage />
    </div>
  )
}