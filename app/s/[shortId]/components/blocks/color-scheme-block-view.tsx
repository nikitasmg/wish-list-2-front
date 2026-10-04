import { cn } from '@/lib/utils'
import { dressColors } from '@/shared/block-data'
import { Block } from '@/shared/types'

/**
 * «Дресс-код»: круги, полосы или арки. «Взять из схемы» показывает цвета
 * самой страницы — они всегда совпадают с тем, что гость видит вокруг.
 */
export function ColorSchemeBlockView({ block }: { block: Block }) {
  const fromScheme = block.data.fromScheme === true
  const colors = fromScheme
    ? [{ hex: 'hsl(var(--background))', name: 'Фон' }, { hex: 'hsl(var(--card))', name: 'Карточки' }, { hex: 'hsl(var(--primary))', name: 'Акцент' }, { hex: 'hsl(var(--foreground))', name: 'Текст' }]
    : dressColors(block.data)
  const showNames = block.data.showNames !== false
  const note = String(block.data.note ?? block.data.label ?? '')
  const view = block.view ?? 'circles'
  if (!colors.length) return null

  return <div className="space-y-4">
    {view === 'stripes' ? (
      <div className="space-y-2">
        <div className="flex h-14 overflow-hidden rounded-block border">
          {colors.map((c, i) => <span key={i} className="flex-1" style={{ background: c.hex }} />)}
        </div>
        {showNames && <div className="flex text-caption text-muted-foreground">{colors.map((c, i) => <span key={i} className="flex-1 truncate text-center">{c.name}</span>)}</div>}
      </div>
    ) : (
      <div className="flex flex-wrap gap-4">
        {colors.map((c, i) => <div key={i} className="flex flex-col items-center gap-1.5">
          <span
            className={cn('block border', view === 'arches' ? 'h-16 w-12 rounded-t-full' : 'h-12 w-12 rounded-full')}
            style={{ background: c.hex }}
            title={c.name || undefined}
          />
          {showNames && c.name && <span className="text-caption">{c.name}</span>}
        </div>)}
      </div>
    )}
    {note && <p className="text-body-sm text-muted-foreground">{note}</p>}
  </div>
}
