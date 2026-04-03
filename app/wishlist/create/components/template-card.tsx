'use client'

import * as React from 'react'
import { WishlistTemplate } from '@/content/templates'

type Props = {
  template: WishlistTemplate
  onClick: (template: WishlistTemplate) => void
}

export function TemplateCard({ template, onClick }: Props) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150"
      style={{
        boxShadow: hovered
          ? `0 6px 16px ${template.accentColor}40`
          : '0 1px 4px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(template)}
    >
      <div
        className="px-4 pt-5 pb-3.5 text-center"
        style={{
          background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.accentColor})`,
        }}
      >
        <div className="text-4xl mb-1">{template.emoji}</div>
        <div className="text-[10px] uppercase tracking-widest font-semibold text-white/90 drop-shadow-sm">
          {template.category}
        </div>
      </div>
      <div
        className="bg-white px-3.5 py-3"
        style={{ borderTop: `2px solid ${template.accentColor}` }}
      >
        <div className="font-bold text-sm mb-0.5">{template.label}</div>
        <div className="text-xs text-muted-foreground leading-relaxed">{template.description}</div>
      </div>
    </div>
  )
}
