'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { DressColor, Person, Place, RSVPQuestion, contactPeople, dressColors, locationPoints, pollSettings, rsvpSettings } from '@/shared/block-data'
import { DRESS_DEFAULT, DRESS_PRESETS } from '@/shared/constants'
import { newBlockId } from '@/shared/ids'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'
import { Field, Segmented, Toggle } from './controls'

type Data = Record<string, unknown>
type Props = { data: Data; onChange: (data: Data, key?: string) => void; blockId: string }

const RSVP_FIELDS: [string, string][] = [
  ['plusOne', 'С кем придёт (+1)'],
  ['kids', 'Сколько детей'],
  ['menu', 'Аллергии, меню'],
  ['transfer', 'Трансфер'],
]

/** «Ответ гостя»: что спросить, свои вопросы, дедлайн и «Кто идёт». */
export function RSVPFields({ data, onChange, blockId }: Props) {
  const s = rsvpSettings(data)
  const setQuestions = (questions: RSVPQuestion[], key?: string) => onChange({ ...data, questions }, key)
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-card border bg-muted/30 p-4">
        <div className="text-caption font-semibold text-muted-foreground">Что спросить</div>
        {RSVP_FIELDS.map(([key, label]) => (
          <Toggle
            key={key}
            label={label}
            checked={s.fields.includes(key)}
            onChange={on => onChange({ ...data, fields: on ? [...s.fields, key] : s.fields.filter(f => f !== key) })}
          />
        ))}
        {s.questions.map((question, index) => (
          <div key={question.id} className="space-y-1.5 rounded-control-lg border bg-background p-2.5">
            <div className="flex items-center gap-1.5">
              <Input
                aria-label="Свой вопрос"
                placeholder="Какой торт любите?"
                value={question.label}
                onChange={e => setQuestions(s.questions.map((q, i) => i === index ? { ...q, label: e.target.value } : q), `question:${blockId}:${question.id}`)}
              />
              <button type="button" aria-label="Удалить вопрос" onClick={() => setQuestions(s.questions.filter((_, i) => i !== index))} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control-lg text-muted-foreground hover:text-destructive">
                <X size={15} aria-hidden />
              </button>
            </div>
            <Segmented
              label="Тип ответа"
              value={question.kind}
              options={[['text', 'Текст'], ['number', 'Число'], ['bool', 'Да / нет']] as const}
              onChange={kind => setQuestions(s.questions.map((q, i) => i === index ? { ...q, kind } : q))}
            />
          </div>
        ))}
        {s.questions.length < 10 && (
          <button
            type="button"
            onClick={() => setQuestions([...s.questions, { id: newBlockId(), label: '', kind: 'text' }])}
            className="h-control-sm w-full rounded-control border border-dashed text-caption font-semibold text-muted-foreground hover:border-primary hover:text-primary"
          >
            + Свой вопрос
          </button>
        )}
      </div>
      <Field label="Ответить до" hint="После этой даты форма закроется">
        <Input type="date" value={s.deadline.slice(0, 10)} onChange={e => onChange({ ...data, deadline: e.target.value })} />
      </Field>
      <Toggle label="Показывать «Кто идёт»" checked={s.showGuests} onChange={showGuests => onChange({ ...data, showGuests })} />
    </div>
  )
}

/** «Голосование»: вопрос, варианты, один/несколько, видимость результатов, закрытие. */
export function PollFields({ data, onChange, blockId }: Props) {
  const s = pollSettings(data)
  const setOptions = (options: { id: string; text: string }[], key?: string) => onChange({ ...data, options }, key)
  return (
    <div className="space-y-4">
      <Field label="Вопрос">
        <Input value={s.question} onChange={e => onChange({ ...data, question: e.target.value }, `question:${blockId}`)} placeholder="Какой торт заказать?" />
      </Field>
      <Field label="Варианты" hint="Порядок меняется стрелками, голоса остаются за вариантом">
        <div className="space-y-1.5">
          {s.options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-1">
              <Input
                aria-label={`Вариант ${index + 1}`}
                value={option.text}
                onChange={e => setOptions(s.options.map((o, i) => i === index ? { ...o, text: e.target.value } : o), `option:${blockId}:${option.id}`)}
              />
              <button type="button" aria-label="Выше" disabled={index === 0} onClick={() => setOptions(swap(s.options, index, index - 1))} className="flex h-9 w-7 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowUp size={14} aria-hidden /></button>
              <button type="button" aria-label="Ниже" disabled={index === s.options.length - 1} onClick={() => setOptions(swap(s.options, index, index + 1))} className="flex h-9 w-7 shrink-0 items-center justify-center text-muted-foreground disabled:opacity-30"><ArrowDown size={14} aria-hidden /></button>
              <button
                type="button"
                aria-label="Удалить вариант"
                disabled={s.options.length <= 2}
                onClick={() => setOptions(s.options.filter((_, i) => i !== index))}
                className="flex h-9 w-7 shrink-0 items-center justify-center text-muted-foreground hover:text-destructive disabled:opacity-30"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          ))}
          {s.options.length < 12 && (
            <button
              type="button"
              onClick={() => setOptions([...s.options, { id: newBlockId(), text: '' }])}
              className="h-control w-full rounded-control border border-dashed px-3 text-left text-label text-muted-foreground hover:border-primary hover:text-primary"
            >
              + Вариант
            </button>
          )}
        </div>
      </Field>
      <Field label="Выбор">
        <Segmented label="Сколько вариантов можно выбрать" value={s.multiple ? 'many' : 'one'} options={[['one', 'Один'], ['many', 'Несколько']] as const} onChange={v => onChange({ ...data, multiple: v === 'many' })} />
      </Field>
      <Field label="Результаты видны">
        <div role="group" aria-label="Результаты видны" className="flex flex-col gap-0.5 rounded-control border p-0.5">
          {([['all', 'Сразу всем'], ['after_vote', 'После голоса'], ['owner', 'Только мне']] as const).map(([value, name]) => (
            <button
              key={value}
              type="button"
              aria-pressed={s.results === value}
              onClick={() => onChange({ ...data, results: value })}
              className={cn('h-control-sm rounded-tag text-label font-semibold', s.results === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              {name}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Закрыть голосование" hint="Пусто — открыто всегда">
        <Input type="date" value={s.closesAt.slice(0, 10)} onChange={e => onChange({ ...data, closesAt: e.target.value })} />
      </Field>
      <Toggle label="Гости могут добавить вариант" checked={s.guestOptions} onChange={guestOptions => onChange({ ...data, guestOptions })} />
    </div>
  )
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

const PRESET = DRESS_PRESETS
const RECENT_KEY = 'dress-code-recent'

function readRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[] } catch { return [] }
}
function pushRecent(hex: string) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([hex, ...readRecent().filter(c => c !== hex)].slice(0, 6))) } catch { /* без памяти — не страшно */ }
}

/** Выбор цвета: цвета-подсказки, недавние и свой код. */
function ColorPicker({ value, onChange, children, confirmLabel = 'Применить' }: { value: string; onChange: (hex: string) => void; children: React.ReactNode; confirmLabel?: string }) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [code, setCode] = useState(value)
  useEffect(() => { setCode(value) }, [value])
  const pick = (hex: string) => {
    setCode(hex)
  }
  return (
    <Popover open={open} onOpenChange={next => { setOpen(next); if (next) { setRecent(readRecent()); setCode(value) } }}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[232px] space-y-3 p-3">
        <input type="color" aria-label="Палитра" value={/^#[0-9a-f]{6}$/i.test(code) ? code : value} onChange={e => pick(e.target.value.toUpperCase())} className="h-16 w-full cursor-pointer rounded-control-lg border-0 bg-transparent p-0" />
        <div className="flex flex-wrap gap-1.5">
          {PRESET.map(hex => <Swatch key={hex} hex={hex} onClick={() => pick(hex)} />)}
        </div>
        {recent.length > 0 && (
          <div className="space-y-1">
            <div className="text-micro font-semibold text-muted-foreground">Недавние</div>
            <div className="flex flex-wrap gap-1.5">{recent.map(hex => <Swatch key={hex} hex={hex} onClick={() => pick(hex)} />)}</div>
          </div>
        )}
        <Input
          aria-label="Код цвета"
          value={code}
          onChange={e => {
            setCode(e.target.value)
            if (/^#[0-9a-f]{6}$/i.test(e.target.value)) pick(e.target.value.toUpperCase())
          }}
          placeholder={DRESS_DEFAULT}
        />
        <Button type="button" className="w-full" disabled={!/^#[0-9a-f]{6}$/i.test(code)} onClick={() => {
          const hex = code.toUpperCase()
          onChange(hex)
          pushRecent(hex)
          setOpen(false)
        }}>{confirmLabel}</Button>
      </PopoverContent>
    </Popover>
  )
}

function Swatch({ hex, onClick }: { hex: string; onClick: () => void }) {
  return <button type="button" aria-label={hex} onClick={onClick} className="h-6 w-6 rounded-full border" style={{ backgroundColor: hex }} />
}

/** «Дресс-код»: кружок открывает выбор цвета, название пишется под кружком. */
export function DressCodeFields({ data, onChange, blockId }: Props) {
  const colors = dressColors(data)
  const set = (next: DressColor[], key?: string) => onChange({ ...data, colors: next }, key)
  return (
    <div className="space-y-4">
      <Field label="Цвета">
        <div className="flex flex-wrap gap-3">
          {colors.map((color, index) => (
            <div key={index} className="flex w-14 flex-col items-center gap-1">
              <div className="relative">
                <ColorPicker value={color.hex} onChange={hex => set(colors.map((c, i) => i === index ? { ...c, hex } : c))}>
                  <button type="button" aria-label={`Цвет ${index + 1}: ${color.name || color.hex}`} className="h-11 w-11 rounded-full border" style={{ backgroundColor: color.hex }} />
                </ColorPicker>
                <button type="button" aria-label="Убрать цвет" onClick={() => set(colors.filter((_, i) => i !== index))} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <X size={10} aria-hidden />
                </button>
              </div>
              <input
                aria-label="Название цвета"
                value={color.name}
                placeholder="цвет"
                onChange={e => set(colors.map((c, i) => i === index ? { ...c, name: e.target.value } : c), `color-name:${blockId}:${index}`)}
                className="w-full bg-transparent text-center text-micro outline-none placeholder:text-muted-foreground"
              />
            </div>
          ))}
          {colors.length < 8 && (
            <ColorPicker confirmLabel="Добавить" value={DRESS_DEFAULT} onChange={hex => set([...colors, { hex, name: '' }])}>
              <button type="button" aria-label="Добавить цвет" className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed text-muted-foreground hover:border-primary hover:text-primary">
                <Plus size={18} aria-hidden />
              </button>
            </ColorPicker>
          )}
        </div>
      </Field>
      <Toggle label="Показывать названия" checked={data.showNames !== false} onChange={showNames => onChange({ ...data, showNames })} />
      <Toggle label="Взять из схемы страницы" checked={data.fromScheme === true} onChange={fromScheme => onChange({ ...data, fromScheme })} />
      <Field label="Подпись под цветами">
        <Input value={String(data.note ?? data.label ?? '')} placeholder="Можно не всё сразу :)" onChange={e => onChange({ ...data, note: e.target.value, label: undefined }, `note:${blockId}`)} />
      </Field>
    </div>
  )
}

/** «Место»: до трёх точек — у свадьбы регистрация и банкет в разных местах. */
export function LocationFields({ data, onChange, blockId }: Props) {
  const points = locationPoints(data)
  const list: Place[] = points.length ? points : [{ name: '', address: '', link: '' }]
  const save = (next: Place[], key?: string) => {
    const [first, ...rest] = next
    onChange({ ...data, name: first?.name ?? '', address: first?.address ?? '', link: first?.link ?? '', points: rest }, key)
  }
  return (
    <div className="space-y-3">
      {list.map((point, index) => (
        <div key={index} className="space-y-1.5 rounded-control-lg border p-3">
          <div className="flex items-center justify-between text-caption font-semibold text-muted-foreground">
            Точка {index + 1}
            {index > 0 && <button type="button" onClick={() => save(list.filter((_, i) => i !== index))} className="hover:text-destructive">Убрать</button>}
          </div>
          <Input aria-label="Название места" placeholder="Детский центр «Орбита»" value={point.name} onChange={e => save(list.map((p, i) => i === index ? { ...p, name: e.target.value } : p), `place:${blockId}:${index}`)} />
          <Input aria-label="Адрес" placeholder="ул. Ленина, 24, 2 этаж" value={point.address ?? ''} onChange={e => save(list.map((p, i) => i === index ? { ...p, address: e.target.value } : p), `address:${blockId}:${index}`)} />
          <Input aria-label="Ссылка на карту" placeholder="Ссылка на карту — необязательно" value={point.link ?? ''} onChange={e => save(list.map((p, i) => i === index ? { ...p, link: e.target.value } : p), `link:${blockId}:${index}`)} />
        </div>
      ))}
      {list.length < 3 && (
        <button type="button" onClick={() => save([...list, { name: '', address: '', link: '' }])} className="h-control w-full rounded-control border border-dashed text-caption font-semibold text-muted-foreground hover:border-primary hover:text-primary">
          + Ещё точка
        </button>
      )}
      <Field label="Пояснение">
        <Input value={String(data.note ?? '')} placeholder="Родители могут остаться — для вас кофе" onChange={e => onChange({ ...data, note: e.target.value }, `note:${blockId}`)} />
      </Field>
    </div>
  )
}

/** «Контакты»: до трёх человек, кнопка «Написать» ведёт в телеграм или звонок. */
export function ContactFields({ data, onChange, blockId }: Props) {
  const people = contactPeople(data)
  const list: Person[] = people.length ? people : [{ name: '', role: '', phone: '', telegram: '' }]
  const save = (next: Person[], key?: string) => {
    const [first, ...rest] = next
    onChange({ ...data, name: first?.name ?? '', role: first?.role ?? '', phone: first?.phone ?? '', telegram: first?.telegram ?? '', people: rest }, key)
  }
  const field = (index: number, name: keyof Person, label: string, placeholder: string) => (
    <Input
      aria-label={label}
      placeholder={placeholder}
      value={list[index][name] ?? ''}
      onChange={e => save(list.map((p, i) => i === index ? { ...p, [name]: e.target.value } : p), `${name}:${blockId}:${index}`)}
    />
  )
  return (
    <div className="space-y-3">
      {list.map((_, index) => (
        <div key={index} className="space-y-1.5 rounded-control-lg border p-3">
          <div className="flex items-center justify-between text-caption font-semibold text-muted-foreground">
            Человек {index + 1}
            {index > 0 && <button type="button" onClick={() => save(list.filter((__, i) => i !== index))} className="hover:text-destructive">Убрать</button>}
          </div>
          {field(index, 'name', 'Имя', 'Катя')}
          {field(index, 'role', 'Кто это', 'мама Тёмы, по всем вопросам')}
          {field(index, 'telegram', 'Telegram', '@username')}
          {field(index, 'phone', 'Телефон', '+7 999 123 45 67')}
        </div>
      ))}
      {list.length < 3 && (
        <button type="button" onClick={() => save([...list, { name: '', role: '', phone: '', telegram: '' }])} className="h-control w-full rounded-control border border-dashed text-caption font-semibold text-muted-foreground hover:border-primary hover:text-primary">
          + Ещё человек
        </button>
      )}
    </div>
  )
}
