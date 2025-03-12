'use client'
import { useApiLogout } from '@/api/user'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User } from '@/shared/types'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  user: User
};

export const UserAvatar = ({ user }: Props) => {
  const [ isConfirmModalOpen, setIsConfirmModalOpen ] = React.useState(false)
  const { mutate: logoutMutate } = useApiLogout()
  const navigation = useRouter()
  const logout = () => {
    logoutMutate()
    window.location.replace('/login')
  }

  return (
    <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <Avatar>
            <AvatarFallback>{user.username?.at(0)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigation.push('/wishlist')}>Мои вишлисты</DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsConfirmModalOpen(true)}
          >
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Вы уверены, что хотите выйти?</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={logout}>Выйти</AlertDialogCancel>
          <AlertDialogAction>Отмена</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}