'use client'

import { useApiReservePresent } from '@/api/present'
import { Present } from '@/shared/types'
import { SchemeConfig } from './scheme-config'
import { ConfirmReserveModal } from './confirm-modal'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ExternalLinkIcon } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import { useState } from 'react'

type Props = {
  presents: Present[]
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
  isExample?: boolean
}

export function PresentsList({ presents, wishlistId, theme, config, isHidden, isExample }: Props) {
  if (!presents.length) return null

  return (
    <div className="space-y-3">
      {presents.map(present => (
        <PresentRow
          key={present.id}
          present={present}
          wishlistId={wishlistId}
          theme={theme}
          config={config}
          isHidden={isHidden}
          isExample={isExample}
        />
      ))}
    </div>
  )
}

function PresentRow({
  present, wishlistId, theme, config, isHidden, isExample,
}: {
  present: Present
  wishlistId: string
  theme: string
  config: SchemeConfig
  isHidden: boolean
  isExample?: boolean
}) {
  const { mutate, isPending } = useApiReservePresent(wishlistId)
  const [exampleReserved, setExampleReserved] = useState(present.reserved)

  const reserved = isExample ? exampleReserved : present.reserved

  const handleReserve = () => {
    if (isExample) {
      setExampleReserved(true)
      toast({ title: 'Подарок забронирован!', variant: 'success' })
      return
    }
    mutate({ presentId: present.id }, {
      onSuccess: () => toast({ title: 'Подарок забронирован!', variant: 'success' }),
    })
  }

  return (
    <div className={cn(
      'flex items-center gap-4 bg-card p-4 border border-border/40',
      reserved && 'opacity-60',
      config.cardRounded,
    )}>
      <div className={cn('w-16 h-16 flex-shrink-0 overflow-hidden bg-muted', config.cardRounded)}>
        {present.cover ? (
          <Image src={present.cover} alt={present.title} width={64} height={64} unoptimized className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🎁</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-foreground truncate">{present.title}</div>
        {present.description && (
          <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{present.description}</div>
        )}
        {present.link && (
          <a href={present.link} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
            <ExternalLinkIcon className="w-3 h-3" /> Ссылка
          </a>
        )}
      </div>

      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {present.price && (
          <span className="text-sm font-bold text-primary whitespace-nowrap">
            {present.price.toLocaleString('ru-RU')} ₽
          </span>
        )}
        {!isHidden && (
          <ConfirmReserveModal theme={theme} disabled={reserved} onClick={handleReserve}>
            <Button
              size="sm"
              loading={isPending}
              variant={reserved ? 'destructive' : 'default'}
              disabled={reserved}
            >
              {reserved ? 'Забронирован' : 'Забронировать'}
            </Button>
          </ConfirmReserveModal>
        )}
      </div>
    </div>
  )
}
