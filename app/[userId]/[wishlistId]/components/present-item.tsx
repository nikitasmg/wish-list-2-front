import { useApiReservePresent } from '@/api/present'
import { ConfirmReserveModal } from '@/app/[userId]/[wishlistId]/components/confirm-modal'

import { Button } from '@/components/ui/button'
import { Present } from '@/shared/types'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import * as React from 'react'

type Props = {
  present: Present
  theme: string
}

export const PresentItem = ({ present, theme }: Props) => {
  const { _, wishlistId } = useParams()

  const { mutate, isPending } = useApiReservePresent(wishlistId as string)
  const handleReserve = () => {
    mutate({presentId: present.id })
  }
  return (
    <div className="w-full md:max-w-[350px] bg-card rounded-2xl flex flex-col gap-4 ">
      <div className="relative w-full h-[400px]">
        <Image
          className="rounded-t-2xl"
          src={present.cover}
          alt={'wishlist cover'}
          fill
          objectFit="cover"
        />
      </div>
      <div className="grow flex flex-col gap-4 p-3">
        <div className="text-2xl text-secondary-foreground font-bold mb-2 line-clamp-2">{present.title}
        </div>
        <div className="line-clamp-3 text-foreground">{present.description}
        </div>
        <div className="flex items-center justify-between flex-row gap-2 mt-auto">
          <ConfirmReserveModal theme={theme} disabled={present.reserved} onClick={handleReserve}>
            <Button className="grow"
                    loading={isPending}
                    variant={present.reserved ? 'destructive' : 'default'}
                    disabled={present.reserved}
            >{present.reserved ? 'Уже забрали' : 'Забронировать'}</Button>
          </ConfirmReserveModal>
          <a href={present.link} target="_blank" className="flex text-primary gap-2 hover:underline">В
            магазин <ExternalLink /></a>
        </div>
      </div>
    </div>
  )
}