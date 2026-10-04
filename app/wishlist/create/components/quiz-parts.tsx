'use client'

import { cn } from '@/lib/utils'
import * as React from 'react'

/** Общие кусочки экранов опросника. */

export function StepTitle({ title, hint, kicker }: { title: string; hint?: string; kicker?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {kicker && <div className="flex items-center gap-2 text-caption font-bold text-primary">{kicker}</div>}
      <h1 className="text-title-lg font-extrabold">{title}</h1>
      {hint && <p className="text-body leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-label font-semibold">
        {label}
        {optional && <span className="font-medium text-muted-foreground"> · по желанию</span>}
      </span>
      {children}
      {hint && <span className="block text-caption text-muted-foreground">{hint}</span>}
    </label>
  )
}

export function Chip({ active, onClick, children, className }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-body-sm font-semibold transition-colors',
        active ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}
