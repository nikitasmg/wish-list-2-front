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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

const getInitials = (user: User) => {
  if (user.displayName) {
    return user.displayName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return user.username?.at(0)?.toUpperCase() ?? '?'
}

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
            {user.avatar && <AvatarImage src={user.avatar} alt={user.displayName ?? user.username} />}
            <AvatarFallback>{getInitials(user)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigation.push('/wishlist')}>Мои вишлисты</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigation.push('/wishlist/settings')}>Настройки профиля</DropdownMenuItem>
          <DropdownMenuSeparator />
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