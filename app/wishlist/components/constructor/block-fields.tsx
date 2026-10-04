'use client'
import { Block, Wishlist } from '@/shared/types'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/image-upload'
import { QuoteBlockEditor } from './blocks/quote-block-editor'
import { VideoBlockEditor } from './blocks/video-block-editor'
import { DateBlockEditor } from './blocks/date-block-editor'
import { TimingBlockEditor } from './blocks/timing-block-editor'
import { DividerBlockEditor } from './blocks/divider-block-editor'
import type { ListItem } from '@/app/s/[shortId]/components/blocks/list-block-view'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { Field, Segmented, Toggle } from './controls'
import { ContactFields, DressCodeFields, LocationFields, PollFields, RSVPFields } from './special-fields'

type Data = Block['data']

/** Подсказка, что писать в пунктах списка, — по виду. */
const LIST_HINT: Record<string, [string, string]> = {
  tags: ['', 'только текст'],
  pairs: ['Подпись', 'подпись + значение'],
  tiles: ['Подпись', 'значение + подпись'],
  schedule: ['Время', 'время + текст'],
  timeline: ['Год', 'год + текст'],
}

export function BlockFields({ block, onChange }: { block: Block; wishlist?: Wishlist; onChange: (data: Data, key?: string) => void }) {
  const data = block.data ?? {}
  const key = (name: string) => `${name}:${block.id}`
  const text = (name: string, label: string, placeholder = '') => (
    <Field label={label}>
      <Input value={String(data[name] ?? '')} placeholder={placeholder} onChange={e => onChange({ ...data, [name]: e.target.value }, key(name))} />
    </Field>
  )
  const image = (name: string, label = 'Фотография') => (
    <ImageUpload key={block.id + name} label={label} previewUrl={String(data[name] ?? '')} onChange={v => onChange({ ...data, [name]: v?.type === 'url' ? v.value : '' })} />
  )
  const props = { data, onChange, blockId: block.id }

  switch (block.type) {
    case 'cover':
      return (
        <div className="space-y-4">
          {text('subtitle', 'Подзаголовок', 'Отмечаем круглую дату')}
          {block.view === 'number' && text('number', 'Число', '30')}
          {image('imageUrl')}
        </div>
      )
    case 'text':
      return (
        <div className="space-y-4">
          <p className="text-caption text-muted-foreground">Текст правится прямо на странице. «/» в пустом блоке меняет его тип.</p>
          <Field label="Размер текста">
            <Segmented label="Размер текста" value={(data.size as 'sm' | 'md' | 'lg') ?? 'md'} options={[['sm', 'Мелкий'], ['md', 'Обычный'], ['lg', 'Крупный']] as const} onChange={size => onChange({ ...data, size })} />
          </Field>
          <Field label="Выравнивание">
            <Segmented label="Выравнивание" value={(data.align as 'left' | 'center') ?? 'left'} options={[['left', 'Слева'], ['center', 'По центру']] as const} onChange={align => onChange({ ...data, align })} />
          </Field>
          {image('imageUrl')}
          {Boolean(data.imageUrl) && (
            <Field label="Фото">
              <Segmented label="Где фото" value={(data.imagePosition as 'side' | 'top') ?? 'side'} options={[['side', 'Сбоку'], ['top', 'Сверху']] as const} onChange={imagePosition => onChange({ ...data, imagePosition })} />
            </Field>
          )}
        </div>
      )
    case 'list': {
      const items = (data.items ?? []) as ListItem[]
      const view = block.view ?? 'tags'
      const [keyLabel, hint] = LIST_HINT[view] ?? LIST_HINT.tags
      const keyField = view === 'schedule' || view === 'timeline' ? 't' : 'k'
      const set = (next: ListItem[], k?: string) => onChange({ ...data, items: next }, k)
      return (
        <div className="space-y-3">
          {view === 'tags' && <Toggle label="Зачеркнуть пункты" checked={data.strike === true} onChange={strike => onChange({ ...data, strike })} />}
          <Field label={`Пункты · ${hint}`}>
            <div className="space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  {keyLabel && (
                    <Input aria-label={keyLabel} placeholder={keyLabel} className="w-24 shrink-0" value={item[keyField] ?? ''} onChange={e => set(items.map((v, n) => n === i ? { ...v, [keyField]: e.target.value } : v), key(`item-k-${i}`))} />
                  )}
                  <Input aria-label="Текст пункта" placeholder="Текст" value={item.v ?? ''} onChange={e => set(items.map((v, n) => n === i ? { ...v, v: e.target.value } : v), key(`item-v-${i}`))} />
                  <button type="button" aria-label="Выше" disabled={i === 0} onClick={() => set(move(items, i, i - 1))} className="flex h-9 w-6 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowUp size={13} aria-hidden /></button>
                  <button type="button" aria-label="Ниже" disabled={i === items.length - 1} onClick={() => set(move(items, i, i + 1))} className="flex h-9 w-6 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowDown size={13} aria-hidden /></button>
                  <button type="button" aria-label="Удалить пункт" onClick={() => set(items.filter((_, n) => n !== i))} className="flex h-9 w-6 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive"><X size={14} aria-hidden /></button>
                </div>
              ))}
              <button type="button" onClick={() => set([...items, { v: '' }])} className="h-control w-full rounded-control border border-dashed text-caption font-semibold text-muted-foreground hover:border-primary hover:text-primary">+ Добавить пункт</button>
            </div>
          </Field>
        </div>
      )
    }
    case 'media': {
      const images = (data.images ?? []) as string[]
      const captions = (data.captions ?? []) as string[]
      return (
        <div className="space-y-5">
          {Array.from({ length: Math.max(1, images.length) }, (_, i) => (
            <div key={i} className="space-y-2">
              <ImageUpload label={`Фото ${i + 1}`} previewUrl={images[i]} onChange={v => { const next = [...images]; next[i] = v?.type === 'url' ? v.value : ''; onChange({ ...data, images: next }) }} />
              <Input aria-label={`Подпись фото ${i + 1}`} placeholder="Подпись" value={captions[i] ?? ''} onChange={e => { const next = [...captions]; next[i] = e.target.value; onChange({ ...data, captions: next }, key(`caption-${i}`)) }} />
              {images.length > 1 && <button type="button" className="text-caption text-muted-foreground hover:text-destructive" onClick={() => onChange({ ...data, images: images.filter((_, n) => n !== i), captions: captions.filter((_, n) => n !== i) })}>Удалить фото</button>}
            </div>
          ))}
          {block.view === 'row' && images.length < 3 && <button type="button" onClick={() => onChange({ ...data, images: [...images, ''] })} className="h-control w-full rounded-control border border-dashed text-caption font-semibold text-muted-foreground hover:border-primary hover:text-primary">+ Фото</button>}
          <p className="text-caption text-muted-foreground">Высота — ручкой снизу у выделенного блока на странице.</p>
        </div>
      )
    }
    case 'location': return <LocationFields {...props} />
    case 'contact': return <ContactFields {...props} />
    case 'color_scheme': return <DressCodeFields {...props} />
    case 'rsvp': return <RSVPFields {...props} />
    case 'poll': return <PollFields {...props} />
    case 'quote': return <QuoteBlockEditor data={data} onChange={next => onChange(next, key('quote'))} />
    case 'video': return <VideoBlockEditor data={data} onChange={next => onChange(next, key('video'))} />
    case 'date': return <DateBlockEditor data={data} onChange={onChange} />
    case 'timing': return <TimingBlockEditor data={data} onChange={onChange} />
    case 'divider': return <DividerBlockEditor data={data} onChange={onChange} />
    case 'wishlist': return <p className="text-body-sm text-muted-foreground">Подарки добавляются во вкладке «Подарки» в шапке. Этот блок задаёт их место и вид на странице.</p>
    case 'playlist': return <Toggle label="Гости голосуют за треки" checked={data.votes !== false} onChange={votes => onChange({ ...data, votes })} />
    case 'guestbook': return <p className="text-body-sm text-muted-foreground">Гости оставят имя и пару тёплых слов. Записи можно скрыть в «Доступ → Ответы гостей».</p>
    default: return <p className="text-body-sm text-muted-foreground">Этот блок из старой версии. Добавьте новый блок и перенесите содержимое.</p>
  }
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
