import * as React from 'react'

/** Подпись над элементом управления и подсказка под ним. */
export function Field({ label, children, hint }: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-caption font-semibold text-muted-foreground">{label}</div>
      {children}
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  )
}
