import { WishlistMenu } from '@/app/wishlist/[id]/components/wishlist-menu'
import { PresentMenu } from '@/app/wishlist/[id]/present/components/present-menu'
import { CardCover } from '@/components/CardCover'
import { Present } from '@/shared/types'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  present: Present
  wishlistId: string
};

export const PresentCard = ({ present, wishlistId }: Props) => {
  // const navigate = useRouter()
  return (
    <div
      className="relative w-full md:w-[250px] h-[300] bg-accent flex flex-col rounded-2xl shadow hover:shadow-xl transition"
    >
      <div className="">
        {present.cover
          ? <CardCover className="h-[180px]" cover={present.cover} title={present.title} />
          : <div className="flex justify-center items-center bg-primary w-full h-[180] rounded-t-2xl">
            <Heart size={50} />
          </div>
        }
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="font-bold mb-2 truncate">{present.title}</div>
          <PresentMenu id={present.id} wishlistId={wishlistId} />
        </div>
        {present.description && (
          <div className="truncate">{present.description}</div>
        )}
      </div>
    </div>
  )
}