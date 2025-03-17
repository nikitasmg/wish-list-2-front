import { useApiReservePresent } from '@/api/present'
import { ConfirmReserveModal } from '@/app/[userId]/[wishlistId]/components/confirm-modal'
import { CardCover } from '@/components/card-cover'

import { Button } from '@/components/ui/button'
import { Present } from '@/shared/types'
import { ExternalLink } from 'lucide-react'
import { useParams } from 'next/navigation'
import * as React from 'react'

type Props = {
  present: Present
  theme: string
  isHidden: boolean
}

export const PresentItem = ({ present, theme, isHidden }: Props) => {
  const params = useParams()

  const { mutate, isPending } = useApiReservePresent(params.wishlistId as string)
  const handleReserve = () => {
    mutate({presentId: present.id })
  }
  return (
    <div className="w-full md:max-w-[350px] bg-card rounded-2xl flex flex-col gap-2 ">
        <CardCover cover={present.cover} className='h-[300px]'/>
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
        <div className="flex items-center justify-between flex-row gap-2 mt-auto">
          {!isHidden && <ConfirmReserveModal theme={theme} disabled={present.reserved} onClick={handleReserve}>
            <Button className="grow"
                    loading={isPending}
                    variant={present.reserved ? 'destructive' : 'default'}
                    disabled={present.reserved}
            >{present.reserved ? 'Уже забрали' : 'Забронировать'}</Button>
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