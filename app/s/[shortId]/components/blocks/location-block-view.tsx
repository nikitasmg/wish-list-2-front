'use client'
import { Block } from '@/shared/types'
import { safeLink } from '@/shared/editor-model'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
export function LocationBlockView({ block }: { block: Block }) {
  const name = String(block.data.name ?? '')
  const address = String(block.data.address ?? '')
  const link = safeLink(block.data.link)
  return <div className="rounded-2xl border bg-card p-6 space-y-3"><MapPin className="text-primary" /><p className="text-xl font-semibold">{name || 'Место встречи'}</p><p className="text-muted-foreground">{address}</p><div className="flex flex-wrap gap-2">{address && <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(address); toast({ title: 'Адрес скопирован' }) } catch { toast({ title: 'Не удалось скопировать адрес', variant: 'destructive' }) } }}>Скопировать адрес</Button>}{link && <Button asChild variant="ghost"><a href={link} target="_blank" rel="noopener noreferrer">Открыть ссылку</a></Button>}</div></div>
}
