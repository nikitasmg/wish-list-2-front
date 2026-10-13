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
import { SANTA_LANDING } from '@/shared/santa-route'
import { User } from '@/shared/types'
import { UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

type Props = {
  user: User
  /**
   * Адрес основного сайта — когда меню стоит вне его (у Санты свой домен):
   * ссылки ведут туда целиком, а после выхода человек остаётся на месте.
   */
  origin?: string
  /** Классы темы для меню и диалога: они рисуются в портале, мимо темы страницы. */
  contentClassName?: string
  /** Свои пункты в начале меню — у Санты это «Мои комнаты». */
  menuStart?: React.ReactNode
};

export const UserAvatar = ({ user, origin, contentClassName, menuStart }: Props) => {
  const [ isConfirmModalOpen, setIsConfirmModalOpen ] = React.useState(false)
  const { mutate: logoutMutate } = useApiLogout()
  const navigation = useRouter()
  const go = (path: string) => {
    if (origin) window.location.assign(`${origin}${path}`)
    else navigation.push(path)
  }
  const logout = () => {
    if (origin) { logoutMutate(undefined, { onSettled: () => window.location.reload() }); return }
    logoutMutate()
    window.location.replace('/login')
  }

  return (
    <AlertDialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger aria-label="Мой аккаунт">
          <Avatar>
            {user.avatar && <AvatarImage src={user.avatar} alt={user.displayName ?? user.username} />}
            <AvatarFallback><UserRound size={18} aria-hidden /></AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={contentClassName}>
          <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {menuStart}
          <DropdownMenuItem onClick={() => go('/wishlist')}>Мои вишлисты</DropdownMenuItem>
          <DropdownMenuItem onClick={() => go('/wishlist/settings')}>Настройки профиля</DropdownMenuItem>
          {/* У самого Санты этот пункт лишний: там меню начинается с «Моих комнат». */}
          {!origin && (
            <DropdownMenuItem asChild>
              <a href={SANTA_LANDING}>Тайный Санта</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setIsConfirmModalOpen(true)}
          >
            Выйти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent className={contentClassName}>
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