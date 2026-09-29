'use client'
import { Block } from '@/shared/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/image-upload'
import { TextBlockEditor } from './blocks/text-block-editor'
import { ContactBlockEditor } from './blocks/contact-block-editor'
import { ColorSchemeBlockEditor } from './blocks/color-scheme-block-editor'
import { LocationBlockEditor } from './blocks/location-block-editor'
import { QuoteBlockEditor } from './blocks/quote-block-editor'
import { VideoBlockEditor } from './blocks/video-block-editor'
import { DateBlockEditor } from './blocks/date-block-editor'
import { TimingBlockEditor } from './blocks/timing-block-editor'
import { DividerBlockEditor } from './blocks/divider-block-editor'
import { TextImageBlockEditor } from './blocks/text-image-block-editor'
import type { ListItem } from '@/app/s/[shortId]/components/blocks/list-block-view'

export function BlockFields({ block, onChange }: { block: Block; onChange: (data: Block['data']) => void }) {
  const data = block.data ?? {}
  const field = (name: string, label: string) => <label className="block space-y-1 text-sm"><span>{label}</span><Input value={String(data[name] ?? '')} onChange={e => onChange({ ...data, [name]: e.target.value })} /></label>
  const image = (name: string) => <ImageUpload key={block.id + name} label="Фотография" previewUrl={String(data[name] ?? '')} onChange={v => onChange({ ...data, [name]: v?.type === 'url' ? v.value : '' })} />
  switch (block.type) {
    case 'cover': return <div className="space-y-4">{field('subtitle', 'Подзаголовок')}{block.view === 'number' && field('number', 'Число')}{image('imageUrl')}</div>
    case 'text': return <div className="space-y-4"><TextBlockEditor data={data} onChange={onChange} />{([['size', 'Размер', [['sm', 'Маленький'], ['md', 'Обычный'], ['lg', 'Крупный']]], ['align', 'Выравнивание', [['left', 'Слева'], ['center', 'По центру']]], ['width', 'Ширина', [['full', 'Полная'], ['narrow', 'Узкая']]], ['imagePosition', 'Фотография', [['top', 'Сверху'], ['side', 'Сбоку']]]] as [string, string, string[][]][]).map(([key, label, options]) => <label key={key} className="block text-sm space-y-1"><span>{label}</span><select className="w-full rounded-md border bg-background p-2" value={String(data[key] ?? options[0][0])} onChange={e => onChange({ ...data, [key]: e.target.value })}>{options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select></label>)}{image('imageUrl')}</div>
    case 'list': {
      const items = (data.items ?? []) as ListItem[]
      return <div className="space-y-3">{items.map((item, i) => <div key={i} className="rounded-xl border p-3 space-y-2">{(['k', 't', 'v'] as const).map(key => <Input key={key} aria-label={key === 'v' ? 'Текст пункта' : key === 't' ? 'Время' : 'Подпись'} placeholder={key === 'v' ? 'Текст' : key === 't' ? 'Время / год' : 'Подпись'} value={item[key] ?? ''} onChange={e => onChange({ ...data, items: items.map((v, n) => n === i ? { ...v, [key]: e.target.value } : v) })} />)}<Button variant="ghost" size="sm" onClick={() => onChange({ ...data, items: items.filter((_, n) => n !== i) })}>Удалить пункт</Button></div>)}<Button variant="outline" onClick={() => onChange({ ...data, items: [...items, { v: '' }] })}>Добавить пункт</Button><label className="flex gap-2 text-sm"><input type="checkbox" checked={Boolean(data.strike)} onChange={e => onChange({ ...data, strike: e.target.checked })} />Зачеркнуть пункты</label></div>
    }
    case 'media': {
      const images = (data.images ?? []) as string[]
      const captions = (data.captions ?? []) as string[]
      return <div className="space-y-5">{Array.from({ length: Math.max(1, images.length) }, (_, i) => <div key={i} className="space-y-2"><ImageUpload label={`Фото ${i + 1}`} previewUrl={images[i]} onChange={v => { const next = [...images]; next[i] = v?.type === 'url' ? v.value : ''; onChange({ ...data, images: next }) }} /><Input aria-label={`Подпись фото ${i + 1}`} placeholder="Подпись" value={captions[i] ?? ''} onChange={e => { const next = [...captions]; next[i] = e.target.value; onChange({ ...data, captions: next }) }} /><Button size="sm" variant="ghost" onClick={() => onChange({ ...data, images: images.filter((_, n) => n !== i), captions: captions.filter((_, n) => n !== i) })}>Удалить фото</Button></div>)}{images.length < 3 && <Button variant="outline" onClick={() => onChange({ ...data, images: [...images, ''] })}>Добавить фото</Button>}</div>
    }
    case 'location': return <LocationBlockEditor data={data} onChange={onChange} />
    case 'contact': return <ContactBlockEditor data={data} onChange={onChange} />
    case 'color_scheme': return <ColorSchemeBlockEditor data={data} onChange={onChange} />
    case 'quote': return <QuoteBlockEditor data={data} onChange={onChange} />
    case 'video': return <VideoBlockEditor data={data} onChange={onChange} />
    case 'date': return <DateBlockEditor data={data} onChange={onChange} />
    case 'timing': return <TimingBlockEditor data={data} onChange={onChange} />
    case 'divider': return <DividerBlockEditor data={data} onChange={onChange} />
    case 'text_image': return <TextImageBlockEditor data={data} onChange={onChange} />
    case 'wishlist': return <p className="text-sm text-muted-foreground">Подарки добавляются во вкладке «Подарки». Этот блок задаёт их место и внешний вид на странице.</p>
    case 'rsvp': return <fieldset className="space-y-3"><legend className="mb-3 text-sm">Что спросить у гостей</legend>{[['plusOne', 'Спутники'], ['kids', 'Дети'], ['menu', 'Ограничения в еде'], ['transfer', 'Нужен трансфер']].map(([key, label]) => <label key={key} className="flex gap-2 text-sm"><input type="checkbox" checked={((data.fields ?? []) as string[]).includes(key)} onChange={e => { const fields = (data.fields ?? []) as string[]; onChange({ ...data, fields: e.target.checked ? [...fields, key] : fields.filter(v => v !== key) }) }} />{label}</label>)}</fieldset>
    case 'poll': return <div className="space-y-3">{field('question', 'Вопрос')}<label className="block text-sm space-y-1"><span>Варианты — по одному в строке</span><Textarea value={((data.options ?? []) as string[]).join('\n')} onChange={e => onChange({ ...data, options: e.target.value.split('\n') })} /></label></div>
    case 'playlist': return <label className="flex gap-2 text-sm"><input type="checkbox" checked={data.votes !== false} onChange={e => onChange({ ...data, votes: e.target.checked })} />Голосование за треки</label>
    case 'guestbook': return <p className="text-sm text-muted-foreground">Гости смогут оставить имя и поздравление. Записи можно скрыть в разделе «Ответы гостей».</p>
    default: return <p className="text-sm text-muted-foreground">Этот блок из старой версии. Добавьте новый блок и перенесите содержимое.</p>
  }
}
