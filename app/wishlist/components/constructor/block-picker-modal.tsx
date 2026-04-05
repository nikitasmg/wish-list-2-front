'use client'

import { PALETTE_ITEMS } from '@/app/wishlist/components/constructor/block-palette'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BlockType } from '@/shared/types'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (type: BlockType) => void
}

export function BlockPickerModal({ open, onClose, onSelect }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Выберите блок</DialogTitle>
          <DialogDescription className="sr-only">
            Выберите тип блока для добавления на холст
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onSelect(item.type)}
              className="text-left rounded-lg border bg-card p-4 hover:border-primary/50 hover:bg-accent/30 transition-colors space-y-2 overflow-hidden"
            >
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <div>{item.preview}</div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
