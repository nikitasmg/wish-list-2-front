import { useApiReservePresent } from '@/api/present'
import { ConfirmReserveModal } from '@/app/s/[shortId]/components/confirm-modal'
import { CardCover } from '@/components/card-cover'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Present } from '@/shared/types'
import { ExternalLink, Heart } from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'

type Props = {
  present: Present
  theme: string
  isHidden: boolean
  wishlistId: string
  isExample?: boolean
}

export const PresentItem = ({ present, theme, isHidden, wishlistId, isExample }: Props) => {
  const { mutate, isPending } = useApiReservePresent(wishlistId)
  const [exampleReserved, setExampleReserved] = useState(present.reserved)

  const reserved = isExample ? exampleReserved : present.reserved

  const handleReserve = () => {
    if (isExample) {
      setExampleReserved(true)
      toast({ title: 'Подарок забронирован!', variant: 'success' })
      return
    }
    mutate({presentId: present.id }, {
      onSuccess: () => {
        toast({title: 'Подарок забронирован!', variant: 'success'})
      }
    })
  }
  return (
    <div className="w-full bg-card rounded-2xl flex flex-col gap-2">
        {present.cover
          ? <CardCover cover={present.cover} className='h-[300px]' />
          : <div className="flex justify-center items-center bg-primary w-full h-[300px] rounded-t-2xl">
              <Heart size={50} />
            </div>
        }
      <div className="grow flex flex-col gap-2 p-3">
        <div
          className="text-2xl text-secondary-foreground font-bold line-clamp-2 min-h-[65px]">
          {present.title}
        </div>
        <div className="line-clamp-3 text-foreground min-h-[72px]">{present.description}
        </div>
        {
          present.price &&
          <div className='text-right font-bold text-l italic text-foreground mt-auto'>{present.price.toLocaleString()} ₽</div>
        }
        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 mt-auto">
          {!isHidden && <ConfirmReserveModal theme={theme} disabled={reserved} onClick={handleReserve}>
            <Button className="grow"
                    loading={isPending}
                    variant={reserved ? 'destructive' : 'default'}
                    disabled={reserved}
            >{reserved ? 'Забронирован' : 'Забронировать'}</Button>
          </ConfirmReserveModal>
          }
          {
            present.link && <a href={present.link} target="_blank" className="flex text-primary gap-2 hover:underline">В
              магазин <ExternalLink /></a>
          }
        </div>
      </div>
    </div>
  )
}
