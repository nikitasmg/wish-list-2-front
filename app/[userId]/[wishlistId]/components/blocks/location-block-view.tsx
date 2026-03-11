import { Block } from '@/shared/types'
import { MapPinIcon } from 'lucide-react'
import React from 'react'

export function LocationBlockView({ block }: { block: Block }) {
  const name = block.data.name as string
  const link = block.data.link as string | undefined
  if (!name) return null
  return (
    <div className="flex gap-4 items-center bg-card p-6 rounded-2xl shadow-md max-w-sm">
      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <MapPinIcon className="w-6 h-6 text-primary" />
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-primary hover:text-accent underline underline-offset-4">
          {name}
        </a>
      ) : (
        <span className="text-xl font-medium text-foreground">{name}</span>
      )}
    </div>
  )
}
