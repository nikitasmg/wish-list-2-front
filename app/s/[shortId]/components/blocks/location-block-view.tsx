'use client'
import { Block } from '@/shared/types'
import { locationPoints, routeUrl } from '@/shared/block-data'
import { MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

/** «Место»: одна точка — маршрут и адрес; несколько — маршрут через все. */
export function LocationBlockView({ block }: { block: Block }) {
  const points = locationPoints(block.data)
  const route = routeUrl(points)
  const note = String(block.data.note ?? '')
  const copy = async (address: string) => {
    try { await navigator.clipboard.writeText(address); toast({ title: 'Адрес скопирован' }) }
    catch { toast({ title: 'Не удалось скопировать адрес', variant: 'destructive' }) }
  }
  if (!points.length) return <p className="text-muted-foreground">Место скоро появится</p>
  return <div className="space-y-4">
    <div className="space-y-4">
      {points.map((point, i) => <div key={i} className="flex gap-3">
        {points.length > 1 && <MapPin size={20} className="mt-1 shrink-0 text-primary" aria-hidden />}
        <div className="space-y-1">
          <p className="heading text-xl font-bold">{point.name || point.address}</p>
          {point.name && point.address && <p className="text-muted-foreground">{point.address}</p>}
        </div>
      </div>)}
    </div>
    {note && <p className="text-muted-foreground">{note}</p>}
    <div className="flex flex-wrap gap-2">
      {route && <Button asChild><a href={route} target="_blank" rel="noopener noreferrer">{points.length > 1 ? 'Все точки на карте' : 'Построить маршрут'}</a></Button>}
      {points.length === 1 && points[0].address && <Button variant="outline" onClick={() => copy(points[0].address!)}>Скопировать адрес</Button>}
    </div>
  </div>
}
