'use client'
import { cn } from '@/lib/utils'
import { ImageOff } from 'lucide-react'
import { useState } from 'react'

export function CardCover({ cover, title, className }: { cover: string; title?: string; className?: string }) {
  return <CoverImage key={cover} cover={cover} title={title} className={className} />
}
function CoverImage({ cover, title, className }: { cover: string; title?: string; className?: string }) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>(cover ? 'loading' : 'error')
  return <div className={cn('relative w-full h-[150px] overflow-hidden rounded-xl bg-muted', className)} aria-busy={state === 'loading'}>
    {state === 'loading' && <div className="absolute inset-0 motion-safe:animate-pulse bg-muted" role="status"><span className="sr-only">Загрузка фотографии</span></div>}
    {state === 'error' ? <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground"><ImageOff size={20} />Фото недоступно</div>
      // eslint-disable-next-line @next/next/no-img-element
      : <img src={cover} alt={title ?? ''} loading="lazy" onLoad={() => setState('ready')} onError={() => setState('error')} className={cn('h-full w-full object-cover transition-opacity', state !== 'ready' && 'opacity-0')} />}
  </div>
}
