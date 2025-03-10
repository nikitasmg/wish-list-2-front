import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { CardCover } from '@/components/card-cover'
import { Button } from '@/components/ui/button'
import { Wishlist } from '@/shared/types'
import { toDate } from 'date-fns'
// import Image from 'next/image'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Gift } from 'lucide-react'

interface WishlistCardProps {
  wishlist: Wishlist
}

export const WishlistCard = ({ wishlist }: WishlistCardProps) => {
  const navigate = useRouter()
  return (
    <div className="group w-[350px] relative border text-card-foreground rounded-xl shadow-lg hover:shadow-xl">
      <CardCover className="h-[200px]" cover={wishlist.cover} title={wishlist.title} />
      {/* Контент */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold line-clamp-1 mb-2">{wishlist.title}</h3>
          <WishlistMenu wishlist={wishlist} />
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{wishlist.description}</p>

        <Button className="w-full mb-4" onClick={() => navigate.push(`/wishlist/${wishlist.id}`)}>Добавить подарки <Gift /> </Button>
        {/* Дополнительная информация */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {
            wishlist.location.time && <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
              {toDate((wishlist.location.time)).toLocaleDateString()}
          </span>
          }
          <span>•</span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {wishlist.presentsCount} подарков
          </span>
        </div>
      </div>
    </div>
  )
}