import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import * as React from 'react'

export const PresentsPage = () => {
  const { userId, wishlistId } = useParams()
  console.log(userId, wishlistId)
  return (
    <div>
      <div className="w-full p-2 md:max-w-[350px] bg-card rounded-2xl flex flex-col gap-4 ">
        <div className="relative w-full h-[200px]">
          <Image
            className="rounded-2xl"
            src={'/ps5.webp'}
            alt={'wishlist cover'}
            fill
            objectFit="cover"
          />
        </div>
        <div className="grow flex flex-col gap-4">
          <div className="text-2xl text-secondary-foreground font-bold mb-2 line-clamp-2">Игровая приставка Sony
            PlayStation 5 Pro
          </div>
          <div className="line-clamp-3 text-foreground">Игровая приставка Sony PlayStation 5 Pro 2 ТБ, цифровая консоль, Pусский язык
          </div>
          <div className='flex items-center flex-row gap-2'>
            <Button className='grow' variant="default">Забронировать</Button>
            <Button className='' variant='link'>В магазин <ExternalLink /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}