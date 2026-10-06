'use client'

import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { Copy } from 'lucide-react'

export function CopyField({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: 'Ссылка скопирована' })
    } catch {
      toast({ variant: 'destructive', title: 'Не получилось скопировать — выделите ссылку вручную' })
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="text-caption font-semibold text-muted-foreground">{label}</div>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          aria-label={label}
          onFocus={e => e.currentTarget.select()}
          className="h-control min-w-0 flex-1 rounded-control border border-border bg-background px-3 text-body-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="button" variant="secondary" size="icon" onClick={copy} aria-label="Скопировать ссылку">
          <Copy aria-hidden />
        </Button>
      </div>
    </div>
  )
}
