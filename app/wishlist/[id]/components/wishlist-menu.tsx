import { useApiGetMe } from '@/api/user'
import { useApiDeleteWishlist } from '@/api/wishlist'
import CoppyLinkButton from '@/components/copy-link-button'
import ShareButton from '@/components/share-button'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wishlist } from '@/shared/types'
import { Ellipsis } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type MenuProps = {
  wishlist: Wishlist
}

export const WishlistMenu = ({ wishlist }: MenuProps) => {
  const navigate = useRouter()
  const { data } = useApiGetMe()
  const { mutate } = useApiDeleteWishlist(wishlist.id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => navigate.push(`/wishlist/edit/${wishlist.id}`)}>
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem>
          <CoppyLinkButton url={`http://localhost:3000/${data?.user?.id}/${wishlist.id}`}/>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <ShareButton title={wishlist.title} cover={wishlist.cover} url={`http://localhost:3000/${data?.user?.id}/${wishlist.id}`}>
            <span>Поделиться</span>
          </ShareButton>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => mutate()}>
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}