import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ReactNode } from 'react'

type Props = {
  theme: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

export function ConfirmReserveModal({ theme, disabled,  onClick, children }: Props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={disabled}>{children}</AlertDialogTrigger>
      <AlertDialogContent className={theme}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-primary">Забронировать подарок?</AlertDialogTitle>
          <AlertDialogDescription>
            Остальные гости увидят, что подарок занят, но не узнают, кем.
            Бронь можно снять — кнопка «Отменить» появится на карточке.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className='bg-secondary'>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={onClick}>Продолжить</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

  )
}
