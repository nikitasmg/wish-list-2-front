import { useApiDeleteWishlist } from '@/api/wishlist'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Wishlist } from '@/shared/types'
import { Ellipsis } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { SaveAsTemplateModal } from '@/app/wishlist/components/save-as-template-modal'

type MenuProps = {
  wishlist: Wishlist
}

export const WishlistMenu = ({ wishlist }: MenuProps) => {
  const navigate = useRouter()
  const { mutate } = useApiDeleteWishlist(wishlist.id)
  const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false)
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className='relative z-10'>
          <Ellipsis />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => navigate.push(`/wishlist/edit/${wishlist.id}`)}>
            Редактировать
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setSaveTemplateOpen(true)}>
            Сохранить как шаблон
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => mutate()}>
            Удалить
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SaveAsTemplateModal
        wishlistId={wishlist.id}
        wishlistTitle={wishlist.title}
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
      />
    </>
  )
}