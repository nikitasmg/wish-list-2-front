import { Block } from '@/shared/types'
import React from 'react'

export function ContactBlockView({ block }: { block: Block }) {
  const name = block.data.name as string | undefined
  const role = block.data.role as string | undefined
  const phone = block.data.phone as string | undefined
  const telegram = block.data.telegram as string | undefined

  if (!name && !phone && !telegram) return null

  return (
    <div className="flex flex-col gap-1.5">
      {name && <p className="text-lg font-semibold text-foreground">{name}</p>}
      {role && <p className="text-sm text-muted-foreground">{role}</p>}
      <div className="flex flex-wrap gap-3 mt-1">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="text-sm text-primary hover:underline"
          >
            {phone}
          </a>
        )}
        {telegram && (
          <a
            href={`https://t.me/${telegram.replace(/^@/, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {telegram.startsWith('@') ? telegram : `@${telegram}`}
          </a>
        )}
      </div>
    </div>
  )
}
