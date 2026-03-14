import { useApiDeletePresent } from '@/api/present'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Ellipsis } from 'lucide-react'
import * as React from 'react'

type MenuProps = {
  id: string
  wishlistId: string
  onEdit: () => void
}

export const PresentMenu = ({ id, wishlistId, onEdit }: MenuProps) => {
  const { mutate } = useApiDeletePresent(id, wishlistId)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={onEdit}>
          Редактировать
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => mutate()}>
          Удалить
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
