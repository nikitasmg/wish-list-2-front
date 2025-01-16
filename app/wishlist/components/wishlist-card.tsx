import { CardCover } from '@/components/card-cover'
import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { Wishlist } from '@/shared/types'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { Heart } from 'lucide-react'

type Props = {
  wishlist: Wishlist
};

export const WishlistCard = ({ wishlist }: Props) => {
  const navigate = useRouter()
  return (
    <div
      className="relative w-full md:w-[250px] h-[300] bg-accent flex flex-col rounded-2xl shadow hover:shadow-xl transition"
    >
      <div className="cursor-pointer" onClick={() => navigate.push(`/wishlist/${wishlist.id}`)}>
        {wishlist.cover
          ? <CardCover className='h-[180px]' cover={wishlist.cover} title={wishlist.title} />
          : <div className="flex justify-center items-center bg-primary w-full h-[180] rounded-t-2xl">
            <Heart size={50} />
          </div>
        }
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-bold mb-2 truncate">{wishlist.title}</div>
          <WishlistMenu wishlist={wishlist} />
        </div>
        {wishlist.description && (
          <div className="truncate">{wishlist.description}</div>
        )}
      </div>
    </div>
  )
}