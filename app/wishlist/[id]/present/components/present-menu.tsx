import { useApiDeletePresent } from '@/api/present'
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
  wishlistId: string
}

export const PresentMenu = ({ id, wishlistId }: MenuProps) => {
  const navigate = useRouter()
  const { mutate } = useApiDeletePresent(id, wishlistId)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => navigate.push(`/wishlist/${wishlistId}/present/edit/${id}`)}>
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => mutate()}>
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}