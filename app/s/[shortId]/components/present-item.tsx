import { useApiReservePresent, useApiJoinGroupPresent, useApiLeaveGroupPresent } from '@/api/present'
import { ConfirmReserveModal } from '@/app/s/[shortId]/components/confirm-modal'
import { CardCover } from '@/components/card-cover'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Present } from '@/shared/types'
import { ExternalLink, Heart } from 'lucide-react'
import { pluralizeRu } from '@/lib/utils'
import * as React from 'react'
import { useEffect, useState } from 'react'

type Props = {
  present: Present
  theme: string
  isHidden: boolean
  wishlistId: string
  isExample?: boolean
}

export const PresentItem = ({ present, theme, isHidden, wishlistId, isExample }: Props) => {
  const { mutate, isPending } = useApiReservePresent(wishlistId)
  const { mutate: join, isPending: joinPending } = useApiJoinGroupPresent(wishlistId)
  const { mutate: leave, isPending: leavePending } = useApiLeaveGroupPresent(wishlistId)
  const [exampleReserved, setExampleReserved] = useState(present.reserved)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setJoined(localStorage.getItem(`gift-joined-${present.id}`) === '1')
    }
  }, [present.id])

  const handleToggleJoin = () => {
    if (joined) {
      leave({ presentId: present.id }, { onSuccess: () => {
        localStorage.removeItem(`gift-joined-${present.id}`)
        setJoined(false)
      }})
    } else {
      join({ presentId: present.id }, { onSuccess: () => {
        localStorage.setItem(`gift-joined-${present.id}`, '1')
        setJoined(true)
        toast({ title: 'Вы отметили, что хотите подарить!', variant: 'success' })
      }})
    }
  }

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
        {present.type === 'multi' && present.images && present.images.length > 0 ? (
          present.images.length === 1
            ? <CardCover cover={present.images[0]} className="h-[300px]" />
            : (
              <Carousel className="w-full">
                <CarouselContent>
                  {present.images.map((img, i) => (
                    <CarouselItem key={img + i}>
                      <CardCover cover={img} className="h-[300px]" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </Carousel>
            )
        ) : present.cover ? (
          <CardCover cover={present.cover} className="h-[300px]" />
        ) : (
          <div className="flex justify-center items-center bg-primary w-full h-[300px] rounded-t-2xl">
            <Heart size={50} />
          </div>
        )}
      <div className="grow flex flex-col gap-2 p-3">
        <div
          className="text-2xl text-secondary-foreground font-bold line-clamp-2 min-h-[65px]">
          {present.title}
        </div>
        <div className="text-foreground whitespace-pre-line break-words">{present.description}</div>
        {
          present.price &&
          <div className='text-right font-bold text-l italic text-foreground mt-auto'>{present.price.toLocaleString()} ₽</div>
        }
        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 mt-auto">
          {present.type === 'group' ? (
            !isHidden && (
              <div className="w-full flex flex-col gap-2">
                <Button className="grow" loading={joinPending || leavePending}
                  variant={joined ? 'destructive' : 'default'} onClick={handleToggleJoin}>
                  {joined ? 'Не хочу дарить' : 'Я хочу подарить'}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  {present.participantsCount} {pluralizeRu(present.participantsCount, ['человек', 'человека', 'человек'])} {pluralizeRu(present.participantsCount, ['хочет', 'хотят', 'хотят'])} подарить
                </p>
              </div>
            )
          ) : (
            !isHidden && (
              <ConfirmReserveModal theme={theme} disabled={reserved} onClick={handleReserve}>
                <Button className="grow" loading={isPending}
                  variant={reserved ? 'destructive' : 'default'} disabled={reserved}>
                  {reserved ? 'Забронирован' : 'Забронировать'}
                </Button>
              </ConfirmReserveModal>
            )
          )}

          {present.type === 'multi' && present.links && present.links.length > 0 ? (
            <div className="flex flex-col gap-1">
              {present.links.map((l, i) => (
                <a key={l + i} href={l} target="_blank" className="flex text-primary gap-2 hover:underline">
                  В магазин <ExternalLink />
                </a>
              ))}
            </div>
          ) : (
            present.link && (
              <a href={present.link} target="_blank" className="flex text-primary gap-2 hover:underline">
                В магазин <ExternalLink />
              </a>
            )
          )}
        </div>
      </div>
    </div>
  )
}
