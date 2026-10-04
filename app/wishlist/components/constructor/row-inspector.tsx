'use client'

import { Button } from '@/components/ui/button'
import { Layout, layoutRows, ratiosFor, splitRow, updateRow } from '@/shared/layout'
import { RowRatio, RowSettings } from '@/shared/types'
import { Columns2 } from 'lucide-react'
import * as React from 'react'
import { Field, Segmented } from './controls'

/**
 * Вкладка «Ряд»: колонки, пропорции, высота, отступ и порядок на телефоне.
 * Пропорции те же, к которым прилипает разделитель на холсте.
 */
export function RowInspector({ layout, index, onLayout, onDone }: {
  layout: Layout
  index: number
  onLayout: (layout: Layout) => void
  onDone: () => void
}) {
  const row = layoutRows(layout)[index]
  if (!row) return <p className="p-5 text-body-sm text-muted-foreground">Ряд не найден.</p>
  const settings = row.settings
  const columns = settings.columns ?? 1
  const blocks = row.cells.filter(Boolean).length
  const set = (patch: RowSettings) => onLayout(updateRow(layout, index, patch))
  const ratios = ratiosFor(columns).filter(Boolean) as RowRatio[]

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-muted text-primary"><Columns2 size={17} aria-hidden /></span>
        <div>
          <div className="font-bold leading-tight">Ряд · {columns} {columns === 1 ? 'колонка' : 'колонки'}</div>
          <div className="text-caption text-muted-foreground">{blocks} {blocks === 1 ? 'блок' : 'блока'} в ряду</div>
        </div>
      </div>

      <Field label="Колонки" hint={blocks > 1 ? 'Если колонок меньше, чем блоков, лишние встанут рядами ниже.' : undefined}>
        <Segmented
          label="Колонки"
          value={String(columns) as '1' | '2' | '3'}
          options={[['1', '1'], ['2', '2'], ['3', '3']] as const}
          onChange={value => set({ columns: Number(value) })}
        />
      </Field>

      {columns > 1 && (
        <Field label="Пропорции" hint={columns === 2 ? 'Или тяните разделитель — он прилипает к этим долям' : 'Три колонки — всегда поровну'}>
          <Segmented
            label="Пропорции"
            value={(settings.ratio || ratios[0]) as RowRatio}
            options={ratios.map(r => [r, r.replace(/:/g, ' : ')] as const)}
            onChange={ratio => set({ ratio })}
          />
        </Field>
      )}

      {columns > 1 && (
        <Field label="Высота колонок">
          <Segmented
            label="Высота колонок"
            value={settings.height === 'equal' ? 'equal' : 'auto'}
            options={[['equal', 'Одинаковая'], ['auto', 'По содержимому']] as const}
            onChange={height => set({ height })}
          />
        </Field>
      )}

      <Field label="Расстояние между">
        <Segmented
          label="Расстояние между колонками"
          value={(settings.gap || 'm') as 's' | 'm' | 'l'}
          options={[['s', 'S'], ['m', 'M'], ['l', 'L']] as const}
          onChange={gap => set({ gap })}
        />
      </Field>

      {columns > 1 && (
        <Field label="На телефоне" hint="На телефоне колонки встают друг под другом">
          <Segmented
            label="Порядок на телефоне"
            value={settings.mobileReverse ? 'reverse' : 'normal'}
            options={[['normal', 'Друг под другом'], ['reverse', 'Правая — первой']] as const}
            onChange={value => set({ mobileReverse: value === 'reverse' })}
          />
        </Field>
      )}

      {blocks > 1 && (
        <Button variant="outline" className="w-full" onClick={() => { onLayout(splitRow(layout, index)); onDone() }}>
          Разделить ряд на блоки
        </Button>
      )}
    </div>
  )
}
