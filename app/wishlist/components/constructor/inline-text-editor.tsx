'use client'

import { cn } from '@/lib/utils'
import { BLOCK_CATALOG } from '@/shared/editor-model'
import { slashMatches, slashQuery } from '@/shared/slash-menu'
import { BlockType } from '@/shared/types'
import DOMPurify from 'isomorphic-dompurify'
import { Bold, Italic, Link2, List, Underline } from 'lucide-react'
import * as React from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * Правка текста прямо на холсте.
 *
 * Тот же набор тегов, что пропускает TextBlockView на странице гостя:
 * чистим на сохранении, а не только на выдаче. Иначе в базу уезжает мусор,
 * который оставляет contenteditable — <div>, <font>, инлайновые стили, —
 * и текст на странице гостя выглядит не так, как в редакторе.
 */
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'h2', 'h3', 'p', 'br', 'ul', 'ol', 'li', 'a', 'mark']
const ALLOWED_ATTR = ['href', 'target', 'rel']

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

type Props = {
  html: string
  onChange: (html: string) => void
  /** Ctrl/Cmd+Enter — блок следом. */
  onSplit?: () => void
  /** Выбор типа через «/»: блок превращается в выбранный. */
  onConvert?: (type: BlockType) => void
  className?: string
}

export function InlineTextEditor({ html, onChange, onSplit, onConvert, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const [highlight, setHighlight] = useState(0)

  // Меню открывается, только когда «/» — это всё содержимое блока: иначе
  // «ул. Мира 7/2» открывало бы его посреди набора адреса.
  const query = onConvert ? slashQuery(html) : null
  const matches = query === null ? [] : slashMatches(BLOCK_CATALOG, query)
  const menuOpen = active && query !== null && matches.length > 0

  // Подсветка возвращается на первый пункт, когда список поменялся: иначе
  // после набора она указывает на строку, которой уже нет.
  useEffect(() => { setHighlight(0) }, [query])

  const pick = (type: BlockType) => {
    // Команда не должна остаться в блоке: convertBlock даёт чистые данные,
    // но поле всё ещё показывает «/мес» до перерисовки.
    if (ref.current) ref.current.innerHTML = ''
    onConvert?.(type)
  }

  // Внешние изменения втягиваем, только когда поле не в фокусе: иначе
  // перерисовка на каждый ввод сбрасывала бы курсор в начало.
  useEffect(() => {
    const node = ref.current
    if (!node || active) return
    if (node.innerHTML !== html) node.innerHTML = html
  }, [html, active])

  const commit = () => {
    const node = ref.current
    if (!node) return
    const clean = sanitizeRichText(node.innerHTML)
    if (clean !== html) onChange(clean)
  }

  /**
   * execCommand объявлен устаревшим, но замены для contenteditable без
   * внешнего редактора нет: Selection API умеет читать выделение и не умеет
   * его форматировать. Тянуть ради жирного начертания целый редактор дороже.
   */
  const format = (command: string, value?: string) => {
    ref.current?.focus()
    document.execCommand(command, false, value)
    commit()
  }

  const addLink = () => {
    const url = window.prompt('Адрес ссылки', 'https://')
    if (!url) return
    try {
      const parsed = new URL(url)
      // Только http(s): javascript: в ссылке — это XSS, и чистилка его
      // вырежет, но лучше не давать человеку думать, что ссылка сохранилась.
      if (!['http:', 'https:'].includes(parsed.protocol)) return
      format('createLink', parsed.href)
    } catch {
      /* не ссылка — молча ничего не делаем */
    }
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (menuOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        const step = event.key === 'ArrowDown' ? 1 : -1
        setHighlight(current => (current + step + matches.length) % matches.length)
        return
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault()
        pick(matches[highlight].type)
        return
      }
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      ref.current?.blur()
      return
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && onSplit) {
      event.preventDefault()
      commit()
      onSplit()
    }
  }

  const isEmpty = !html.replace(/<[^>]*>/g, '').trim()

  return (
    <div className="relative">
      {active && (
        <div className="absolute -top-11 left-0 z-20 flex items-center gap-0.5 rounded-xl border bg-popover p-1 shadow-lg">
          <ToolbarButton label="Жирный" onClick={() => format('bold')}><Bold className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Курсив" onClick={() => format('italic')}><Italic className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Подчёркнутый" onClick={() => format('underline')}><Underline className="h-4 w-4" /></ToolbarButton>
          <span className="mx-1 h-5 w-px bg-border" aria-hidden />
          <ToolbarButton label="Ссылка" onClick={addLink}><Link2 className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Список" onClick={() => format('insertUnorderedList')}><List className="h-4 w-4" /></ToolbarButton>
          <ToolbarButton label="Выделить акцентом" onClick={() => format('hiliteColor', 'transparent')}>
            <span className="h-4 w-4 rounded-full bg-primary" />
          </ToolbarButton>
        </div>
      )}

      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Текст блока"
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setActive(true)}
        onBlur={() => { setActive(false); commit() }}
        onInput={commit}
        onKeyDown={onKeyDown}
        className={cn(
          'wishlist-prose min-w-0 break-words rounded-lg px-3 py-2 outline-none transition-colors',
          active ? 'ring-2 ring-primary' : 'ring-1 ring-transparent hover:ring-border',
          className,
        )}
      />

      {menuOpen && (
        <ul
          role="listbox"
          aria-label="Тип блока"
          className="absolute left-0 top-full z-30 mt-1 max-h-64 w-64 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg"
        >
          {matches.map((item, index) => (
            <li key={item.type}>
              <button
                type="button"
                role="option"
                aria-selected={index === highlight}
                onMouseEnter={() => setHighlight(index)}
                // Клик мышью не должен уводить фокус раньше, чем сработает выбор
                onMouseDown={event => { event.preventDefault(); pick(item.type) }}
                className={cn(
                  'flex w-full items-baseline justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm',
                  index === highlight ? 'bg-accent text-accent-foreground' : 'text-foreground',
                )}
              >
                <span className="font-medium">{item.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.group}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Подсказки поверх пустого поля: contenteditable не умеет placeholder */}
      {isEmpty && !active && (
        <p className="pointer-events-none absolute inset-0 px-3 py-2 text-muted-foreground">
          Нажмите, чтобы изменить
        </p>
      )}
      {isEmpty && active && (
        <p className="pointer-events-none absolute inset-0 px-3 py-2 text-muted-foreground">
          Начните печатать или нажмите «/», чтобы выбрать тип
        </p>
      )}
    </div>
  )
}

function ToolbarButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Кнопку нажимают мышью, и обычный клик успел бы снять выделение
      // раньше, чем сработает форматирование.
      onMouseDown={event => { event.preventDefault(); onClick() }}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  )
}
