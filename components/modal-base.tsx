import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  trigger: ReactNode
  children?: ReactNode
}

export function ModalBase({ description, title, children, trigger }: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
