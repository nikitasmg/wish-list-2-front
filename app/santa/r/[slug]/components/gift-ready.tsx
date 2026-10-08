'use client'

import { useApiSantaGiftReady } from '@/api/santa'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage } from '@/shared/santa'

export function GiftReady({ slug, ready }: { slug: string; ready: boolean }) {
  const mark = useApiSantaGiftReady(slug)
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-control-lg border border-border bg-card px-4 py-3.5">
      <Switch
        checked={ready}
        disabled={mark.isPending}
        onCheckedChange={value => mark.mutate(value, {
          onSuccess: () => toast({ title: value ? 'Отметили: подарок готов' : 'Отметку сняли' }),
          onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
        })}
      />
      <span className="text-body font-semibold">Подарок готов</span>
      <span className="ml-auto text-caption text-muted-foreground">организатор видит только число</span>
    </label>
  )
}
