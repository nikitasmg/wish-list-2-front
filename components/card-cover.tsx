'use client'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useState } from 'react'

type Props = {
  cover: string
  title?: string
  className?: string
  style?: CSSProperties
  /**
   * Подарок без фото — плитка с первой буквой названия в цветах схемы. Без
   * буквы пустая обложка показывает «Фото недоступно».
   */
  letter?: string
}

export function CardCover(props: Props) {
  return <CoverImage key={props.cover} {...props} />
}

/**
 * Картинка с тремя состояниями из макета: скелетон, пока грузится; размытое →
 * чёткое, когда пришла; нейтральная заглушка, если не загрузилась.
 */
function CoverImage({ cover, title, className, style, letter }: Props) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(cover ? 'loading' : 'error')
  const initial = (letter ?? '').trim().charAt(0).toLocaleUpperCase('ru')
  return <div className={cn('relative h-[150px] w-full overflow-hidden rounded-xl bg-muted', className)} style={style} aria-busy={state === 'loading'}>
    {state === 'loading' && <div className="absolute inset-0 bg-muted motion-safe:animate-pulse" role="status"><span className="sr-only">Загрузка фотографии</span></div>}
    {state === 'error' && !cover && initial
      // Буква растёт вместе с плиткой: в строке таблицы 44px, в карточке 260.
      ? <div className="flex h-full items-center justify-center bg-primary/10 text-primary [container-type:size]" aria-hidden><span className="heading text-[38cqmin] font-extrabold leading-none">{initial}</span></div>
      : state === 'error'
        ? <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><ImageOff size={20} aria-hidden />Фото недоступно</div>
        // eslint-disable-next-line @next/next/no-img-element
        : <img
            src={cover}
            alt={title ?? ''}
            loading="lazy"
            onLoad={() => setState('ready')}
            onError={() => setState('error')}
            className={cn(
              'h-full w-full object-cover transition-[opacity,filter,transform] duration-500',
              state !== 'ready' && 'scale-105 opacity-0 blur-md',
            )}
          />}
  </div>
}
