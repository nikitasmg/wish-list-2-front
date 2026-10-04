'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft, Monitor, Redo2, Share2, Smartphone, Undo2 } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

export type EditorMode = 'page' | 'presents' | 'preview' | 'responses'

type Props = {
  title: string
  templateName?: string
  status: string
  error: boolean
  mode: EditorMode
  presentsCount: number
  onMode: (mode: EditorMode) => void
  scheme: { name: string; colors: readonly string[] }
  onScheme: () => void
  device: 'desktop' | 'phone'
  onDevice: (device: 'desktop' | 'phone') => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onShare: () => void
}

/**
 * Шапка конструктора по макету: назад, название и шаблон, статус сохранения,
 * «Страница / Подарки», схема, ширина, отмена, предпросмотр и «Поделиться».
 *
 * Кнопки «Сохранить» нет: изменения уходят сами, а статус рядом с названием
 * говорит, дошли ли они.
 */
export function EditorHeader(props: Props) {
  const { mode, onMode } = props
  return (
    <header className="flex h-[60px] shrink-0 items-center gap-3 border-b px-4">
      <Link
        href="/wishlist"
        aria-label="Назад к вишлистам"
        className="flex size-control items-center justify-center rounded-control text-muted-foreground transition-colors duration-fast hover:bg-accent hover:text-foreground"
      >
        <ArrowLeft size={18} aria-hidden />
      </Link>

      <div data-tour="title" className="flex min-w-0 items-center gap-2.5">
        <span className="truncate text-lead font-bold">{props.title || 'Мой праздник'}</span>
        {props.templateName && (
          <span className="hidden shrink-0 rounded-full border px-2.5 py-1 text-caption text-muted-foreground xl:inline">
            по шаблону «{props.templateName}»
          </span>
        )}
        <span
          role="status"
          className={cn('hidden shrink-0 text-caption md:inline', props.error ? 'text-destructive' : 'text-muted-foreground')}
        >
          {props.status}
        </span>
      </div>

      <div className="flex-1" />

      <nav aria-label="Раздел" className="flex gap-0.5 rounded-control border p-0.5">
        <ModeTab active={mode === 'page' || mode === 'responses'} onClick={() => onMode('page')}>Страница</ModeTab>
        <ModeTab active={mode === 'presents'} onClick={() => onMode('presents')} tour="tab-presents">
          Подарки {props.presentsCount > 0 && <span className="text-muted-foreground">{props.presentsCount}</span>}
        </ModeTab>
      </nav>

      <div className="flex-1" />

      <div className="flex items-center gap-0.5">
        <IconButton label="Отменить (Ctrl+Z)" disabled={!props.canUndo} onClick={props.onUndo}><Undo2 size={16} aria-hidden /></IconButton>
        <IconButton label="Повторить (Ctrl+Shift+Z)" disabled={!props.canRedo} onClick={props.onRedo}><Redo2 size={16} aria-hidden /></IconButton>
      </div>

      <button
        type="button"
        onClick={props.onScheme}
        className="hidden h-[38px] items-center gap-2 rounded-control border bg-card px-3 text-body-sm font-semibold hover:bg-accent lg:flex"
      >
        <span className="flex" aria-hidden>
          <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: props.scheme.colors[0] }} />
          <span className="-ml-1.5 h-3.5 w-3.5 rounded-full" style={{ backgroundColor: props.scheme.colors[1] }} />
        </span>
        {props.scheme.name}
      </button>

      {mode === 'page' && (
        <div role="group" aria-label="Ширина страницы" className="flex gap-0.5 rounded-control border p-0.5">
          {([['desktop', Monitor, 'Компьютер'], ['phone', Smartphone, 'Телефон']] as const).map(([value, Icon, label]) => (
            <button
              key={value}
              type="button"
              aria-label={label}
              title={label}
              aria-pressed={props.device === value}
              onClick={() => props.onDevice(value)}
              className={cn(
                'flex h-[30px] w-[34px] items-center justify-center rounded-tag',
                props.device === value ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon size={16} aria-hidden />
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        aria-pressed={mode === 'preview'}
        onClick={() => onMode(mode === 'preview' ? 'page' : 'preview')}
        className={cn(
          'h-[38px] rounded-control border px-3.5 text-body-sm font-semibold',
          mode === 'preview' ? 'bg-accent' : 'bg-card hover:bg-accent',
        )}
      >
        {mode === 'preview' ? 'К редактору' : 'Предпросмотр'}
      </button>
      <button
        type="button"
        onClick={props.onShare}
        className="flex h-control items-center gap-2 rounded-control bg-brand px-4 text-body-sm font-bold text-white transition-[transform,opacity] duration-fast hover:opacity-90 active:scale-[.97]"
      >
        <Share2 size={15} aria-hidden />
        Поделиться
      </button>
    </header>
  )
}

function ModeTab({ active, onClick, tour, children }: { active: boolean; onClick: () => void; tour?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      data-tour={tour}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex h-control-sm items-center gap-1.5 rounded-tag px-3.5 text-body-sm font-semibold transition-colors duration-fast',
        active ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function IconButton({ label, onClick, disabled, active, children, className }: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-control-sm items-center justify-center rounded-tag text-muted-foreground',
        'hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-35',
        active && 'bg-accent text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}
