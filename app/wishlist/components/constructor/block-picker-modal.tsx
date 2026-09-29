'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BLOCK_CATALOG } from '@/shared/editor-model'
import { BlockType } from '@/shared/types'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (type: BlockType) => void
}

/**
 * Выбор блока для пустой ячейки. Список берётся из того же каталога, что и
 * библиотека слева и меню по «/» — иначе наборы разъезжаются при каждом
 * новом типе блока.
 */
export function BlockPickerModal({ open, onClose, onSelect }: Props) {
  const groups = Array.from(new Set(BLOCK_CATALOG.map(b => b.group)))

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выберите блок</DialogTitle>
          <DialogDescription className="sr-only">
            Выберите тип блока для добавления на холст
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group} className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{group}</p>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_CATALOG.filter(b => b.group === group).map(item => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => onSelect(item.type)}
                    className="rounded-lg border bg-card px-4 py-3 text-left text-sm font-semibold hover:border-primary/50 hover:bg-accent/30 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
