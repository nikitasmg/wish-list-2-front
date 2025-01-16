import { cn } from '@/lib/utils'
import Image from 'next/image'
import * as React from 'react'

type Props = {
  cover: string
  title?: string
  className?: string
};

export const CardCover = ({ cover, title, className}: Props) => {
  return (
    <div className= {cn("relative w-full h-[150px] overflow-hidden rounded-t-2xl", className)}>
      {/* Размазанная картинка */}
      <div className="absolute inset-0 bg-cover bg-center filter blur-lg rounded-t-2xl">
        <Image
          src={cover}
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="object-center"
        />
      </div>

      {/* Основной контент */}
      <div className="relative w-full h-full rounded-t-md">
        <Image
          className="rounded-t-md"
          src={cover}
          alt={title ?? 'wishlist cover'}
          layout="fill"
          objectFit="cover"
        />
      </div>
    </div>
  )
}