'use client'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { useInputDensity } from '@/components/ui/input-density'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, isValid, parse } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarDays, Clock } from 'lucide-react'
import * as React from 'react'
import { useRef, useState } from 'react'

/**
 * Дата и время вместо системных полей браузера: у каждого браузера они свои,
 * а в тёмных схемах календарь Chrome остаётся белым.
 *
 * Значения — те же строки, что отдавали нативные поля («2026-11-14»,
 * «18:30», «2026-11-14T18:30»), поэтому замена не трогает ни схемы форм, ни
 * данные блоков.
 */

// Те же размеры, что у Input: поле даты стоит с ним в одном ряду.
const DENSITY = {
  lg: 'h-control-lg rounded-control-lg px-3.5 md:text-body',
  md: 'h-control rounded-control px-3 md:text-body-sm',
}

const FIELD = 'flex w-full items-center gap-2 border border-input bg-background text-left text-lead text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50'

type FieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  'aria-label'?: string
  /** Класс поля — например, высота крупного шага квиза. */
  className?: string
  /** Класс поповера: он рисуется вне раздела, и свою схему (Санта) ему задают явно. */
  contentClassName?: string
}

function parseDay(value: string): Date | undefined {
  const date = parse(value.slice(0, 10), 'yyyy-MM-dd', new Date())
  return isValid(date) ? date : undefined
}

export function DatePicker({ value, onChange, placeholder = 'Выберите дату', clearable = true, disabled, className, contentClassName, ...rest }: FieldProps & {
  /** Дату можно снять кнопкой «Очистить». */
  clearable?: boolean
}) {
  const density = useInputDensity()
  const [open, setOpen] = useState(false)
  const date = parseDay(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(FIELD, DENSITY[density], className)} {...rest}>
          <CalendarDays size={16} className="shrink-0 text-muted-foreground" aria-hidden />
          <span className={cn('min-w-0 flex-1 truncate', !date && 'text-muted-foreground')}>
            {date ? format(date, 'd MMMM yyyy', { locale: ru }) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto p-0', contentClassName)} align="start">
        <Calendar
          mode="single"
          locale={ru}
          selected={date}
          defaultMonth={date}
          // Повторный клик по выбранному дню дату не снимает — для этого есть «Очистить».
          onSelect={next => { if (next) onChange(format(next, 'yyyy-MM-dd')); setOpen(false) }}
          initialFocus
        />
        {clearable && date && (
          <div className="border-t p-2">
            <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => { onChange(''); setOpen(false) }}>Очистить</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

const SLOTS = Array.from({ length: 96 }, (_, i) => `${String(Math.floor(i / 4)).padStart(2, '0')}:${String((i % 4) * 15).padStart(2, '0')}`)

/** «9:5» и «09:05» — одно время; мусор — пусто. */
function normalizeTime(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2})[:.\s]?(\d{2})$/)
  if (!match) return ''
  const hours = Number(match[1]), minutes = Number(match[2])
  return hours < 24 && minutes < 60 ? `${String(hours).padStart(2, '0')}:${match[2]}` : ''
}

export function TimePicker({ value, onChange, placeholder = 'Время', clearable = true, disabled, className, contentClassName, ...rest }: FieldProps & {
  clearable?: boolean
}) {
  const density = useInputDensity()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const scrolled = useRef(false)
  const time = normalizeTime(value.slice(0, 5))
  // Список открывается на выбранном времени, а без него — на полудне, не на полуночи.
  const near = SLOTS.find(slot => slot >= (time || '12:00')) ?? SLOTS[0]

  const pick = (next: string) => { onChange(next); setOpen(false) }

  return (
    <Popover open={open} onOpenChange={next => { setOpen(next); setTyped(time); scrolled.current = false }}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} className={cn(FIELD, DENSITY[density], className)} {...rest}>
          <Clock size={16} className="shrink-0 text-muted-foreground" aria-hidden />
          <span className={cn('min-w-0 flex-1 truncate tabular-nums', !time && 'text-muted-foreground')}>{time || placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-40 space-y-2 p-2', contentClassName)} align="start">
        <Input
          aria-label="Время вручную"
          placeholder="чч:мм"
          inputMode="numeric"
          maxLength={5}
          value={typed}
          onChange={e => setTyped(e.target.value)}
          onKeyDown={e => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            const next = normalizeTime(typed)
            if (next) pick(next)
          }}
          onBlur={() => { const next = normalizeTime(typed); if (next && next !== time) onChange(next) }}
        />
        <div
          role="listbox"
          aria-label="Время"
          className="max-h-56 overflow-y-auto"
          ref={node => {
            if (!node || scrolled.current) return
            scrolled.current = true
            node.querySelector('[data-near]')?.scrollIntoView({ block: 'center' })
          }}
        >
          {SLOTS.map(slot => (
            <button
              key={slot}
              type="button"
              role="option"
              aria-selected={slot === time}
              data-near={slot === near ? '' : undefined}
              onClick={() => pick(slot)}
              className={cn(
                'flex h-control-sm w-full items-center rounded-tag px-2.5 text-body-sm tabular-nums',
                slot === time ? 'bg-primary font-semibold text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {slot}
            </button>
          ))}
        </div>
        {clearable && time && (
          <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => pick('')}>Очистить</Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Дата и время одной строкой «2026-11-14T18:30» — как у datetime-local. */
export function DateTimePicker({ value, onChange, clearable = true, disabled, className, contentClassName, ...rest }: Omit<FieldProps, 'placeholder'> & {
  clearable?: boolean
}) {
  const [day = '', clock = ''] = value ? value.split('T') : []
  const time = clock.slice(0, 5)
  const label = rest['aria-label']

  return (
    <div className={cn('grid grid-cols-[minmax(0,1fr)_7rem] gap-1.5', className)}>
      <DatePicker
        id={rest.id}
        aria-label={label ? `${label}: дата` : 'Дата'}
        value={day}
        clearable={clearable}
        disabled={disabled}
        contentClassName={contentClassName}
        // Время без даты не имеет смысла: первая выбранная дата ставит полдень.
        onChange={next => onChange(next ? `${next}T${time || '12:00'}` : '')}
      />
      <TimePicker
        aria-label={label ? `${label}: время` : 'Время'}
        value={time}
        clearable={false}
        disabled={disabled || !day}
        contentClassName={contentClassName}
        onChange={next => { if (day && next) onChange(`${day}T${next}`) }}
      />
    </div>
  )
}
