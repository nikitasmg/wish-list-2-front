'use client'

import { PresentMenu } from '@/app/wishlist/[id]/present/components/present-menu'
import { PresentModal } from '@/app/wishlist/components/present-modal'
import { CardCover } from '@/components/card-cover'
import { Present } from '@/shared/types'
import { Heart } from 'lucide-react'
import * as React from 'react'

type Props = {
  present: Present
  wishlistId: string
}

export const PresentCard = ({ present, wishlistId }: Props) => {
  const [editOpen, setEditOpen] = React.useState(false)

  return (
    <>
      <div className="relative w-full md:w-[250px] bg-accent flex flex-col rounded-card hover:shadow-float transition">
        {(present.images?.[0] || present.cover) ? (
          <CardCover className="h-[180px]" cover={present.images?.[0] || present.cover} title={present.title} />
        ) : (
          <div className="flex justify-center items-center bg-primary w-full h-[180px] rounded-t-card">
            <Heart size={50} />
          </div>
        )}
        {present.type && present.type !== 'single' && (
          <span className="absolute top-2 left-2 text-caption px-2 py-0.5 rounded-full bg-background/80 text-foreground">
            {present.type === 'group' ? 'Групповой' : 'Набор'}
          </span>
        )}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-bold mb-2 truncate">{present.title}</div>
            <PresentMenu
              id={present.id}
              wishlistId={wishlistId}
              onEdit={() => setEditOpen(true)}
            />
          </div>
          {present.description && (
            <div className="truncate text-body-sm text-muted-foreground">{present.description}</div>
          )}
        </div>
      </div>

      <PresentModal
        wishlistId={wishlistId}
        present={present}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
