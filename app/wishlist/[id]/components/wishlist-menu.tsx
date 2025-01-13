import { useApiDeleteWishlist } from '@/api/wishlist'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type MenuProps = {
  id: string
}

export const WishlistMenu = ({ id }: MenuProps) => {
  const navigate = useRouter()
  const { mutate } = useApiDeleteWishlist(id)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => navigate.push(`/wishlist/edit/${id}`)}>
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => mutate()}>
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}