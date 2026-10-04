'use client'

import { useApiCreateFromSystemTemplate } from '@/api/system-template'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { TemplatePreview } from '@/app/wishlist/create/components/template-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  LIST_OCCASION, QuizStep, asksAge, eventDateTime, parseAge, personName, quizSteps, titleSuggestions,
} from '@/shared/create-quiz'
import { formatEventDate } from '@/shared/event-date'
import { withName } from '@/shared/template-name'
import { SystemTemplate, SystemTemplateCategory } from '@/shared/types'
import { ArrowLeft, Baby, Cake, CalendarDays, Gem, Gift, LucideIcon, MapPin, PartyPopper, Star, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useMemo, useState } from 'react'

/**
 * Создание вишлиста с телефона — опросником по шагу на экран.
 *
 * Сетка шаблонов с формой сбоку на телефоне превращалась в длинную ленту,
 * где поля оказывались далеко под шаблонами. Здесь сначала вопросы, а шаблон
 * выбирается последним — превью уже с ответами человека.
 */

type OccasionMeta = { label: string; hint: string; icon: LucideIcon }

const OCCASIONS: Record<string, OccasionMeta> = {
  bday: { label: 'День рождения', hint: 'Свой или близкого', icon: Cake },
  kids: { label: 'Детский праздник', hint: 'ДР ребёнка', icon: Baby },
  wedding: { label: 'Свадьба', hint: 'Для двоих', icon: Gem },
  jubilee: { label: 'Юбилей', hint: 'Круглая дата', icon: Star },
  party: { label: 'Вечеринка', hint: 'Новоселье, гендер-пати', icon: PartyPopper },
  [LIST_OCCASION]: { label: 'Просто список', hint: 'Без даты и места', icon: Gift },
}

const WHO: Record<string, { title: string; label: string; placeholder: string }> = {
  bday: { title: 'Чей праздник?', label: 'Имя именинника', placeholder: 'Маша' },
  kids: { title: 'Как зовут именинника?', label: 'Имя ребёнка', placeholder: 'Тёма' },
  wedding: { title: 'Как зовут пару?', label: 'Первое имя', placeholder: 'Аня' },
  jubilee: { title: 'Чей юбилей?', label: 'Имя', placeholder: 'Ирина Петровна' },
  party: { title: 'Кто зовёт гостей?', label: 'Ваше имя или компания', placeholder: 'Саша и Дима' },
}

const PLACE_CHIPS = ['Дома', 'В кафе', 'Онлайн']

export function CreateQuiz({ templates, categories, initialTemplateId, onCreated, onFailure }: {
  templates: SystemTemplate[]
  categories: SystemTemplateCategory[]
  /** Пришли с витрины шаблонов: повод и шаблон уже выбраны. */
  initialTemplateId: string | null
  onCreated: (id: string) => void
  onFailure: (status?: number) => void
}) {
  const initial = templates.find(t => t.id === initialTemplateId) ?? null

  const [occasion, setOccasion] = useState<string | null>(initial?.category ?? null)
  const [step, setStep] = useState(initial ? 1 : 0)
  const [name, setName] = useState('')
  const [name2, setName2] = useState('')
  const [age, setAge] = useState('')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [place, setPlace] = useState('')
  const [address, setAddress] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(initial?.id ?? null)

  const { mutate: createFromTemplate, isPending: templatePending } = useApiCreateFromSystemTemplate()
  const { mutate: createList, isPending: listPending } = useApiCreateConstructorWishlist()
  const pending = templatePending || listPending

  // Поводы — категории, в которых есть шаблоны, плюс «Просто список».
  const occasions = useMemo(() => [
    ...categories.filter(c => templates.some(t => t.category === c.id)).map(c => c.id),
    LIST_OCCASION,
  ], [categories, templates])

  const steps = quizSteps(occasion)
  const current: QuizStep = steps[Math.min(step, steps.length - 1)]
  const isLast = step >= steps.length - 1
  const shown = templates.filter(t => t.category === occasion)
  const selected = shown.find(t => t.id === pickedId) ?? shown[0] ?? null

  const person = { name, name2, age: parseAge(age) }
  const suggestions = titleSuggestions(occasion, person)
  const finalTitle = title.trim() || (occasion === LIST_OCCASION ? suggestions[0] : '')

  const go = (delta: number) => setStep(s => Math.max(0, Math.min(steps.length - 1, s + delta)))
  const jump = (target: QuizStep) => setStep(Math.max(0, steps.indexOf(target)))

  const pickOccasion = (id: string) => {
    setOccasion(id)
    if (!templates.some(t => t.id === pickedId && t.category === id)) setPickedId(null)
    setStep(1)
  }

  const handleCreate = () => {
    if (occasion === LIST_OCCASION) {
      // Шаблона у списка нет: обложка с названием и сами подарки.
      createList({
        title: finalTitle,
        blocks: [
          { id: '', type: 'cover', row: 0, col: 0, colSpan: 1, view: 'center', title: finalTitle, data: {} },
          { id: '', type: 'wishlist', row: 1, col: 0, colSpan: 1, view: 'cards', data: {} },
        ],
        rows: [{ columns: 1 }, { columns: 1 }],
      }, {
        onSuccess: res => onCreated(res.data.id),
        onError: error => onFailure(error.response?.status),
      })
      return
    }
    if (!selected) return
    createFromTemplate({
      template_id: selected.id,
      title: finalTitle || undefined,
      name: personName(occasion, person) || undefined,
      event_date: eventDateTime(date, time),
      age: asksAge(occasion) ? person.age : undefined,
      place_name: place.trim() || undefined,
      place_address: address.trim() || undefined,
    }, {
      onSuccess: res => onCreated(res.data.id),
      onError: error => onFailure(error.response?.status),
    })
  }

  // Превью — тот же шаблон, но с ответами: названием, именем и возрастом.
  const withAnswers = (template: SystemTemplate): SystemTemplate => {
    const named = withName(template, personName(occasion, person))
    const number = asksAge(occasion) && person.age ? String(person.age) : null
    return {
      ...named,
      sampleTitle: title.trim() || template.sampleTitle,
      blocks: number
        ? named.blocks.map(b => b.type === 'cover' && 'number' in b.data ? { ...b, data: { ...b.data, number } } : b)
        : named.blocks,
    }
  }

  return (
    // Поверх шапки сайта (у неё тоже z-50, но она раньше в разметке): на
    // шаге опросника ей нечего делать, а высоту она отнимает.
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        {step === 0 ? (
          <Link href="/wishlist" aria-label="Закрыть" className="flex h-11 w-11 items-center justify-center rounded-lg">
            <X size={20} aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={() => go(-1)} aria-label="Назад" className="flex h-11 w-11 items-center justify-center rounded-lg">
            <ArrowLeft size={20} aria-hidden />
          </button>
        )}
        <span className="flex-1 text-[13px] text-muted-foreground">
          {step === 0 ? 'Новый вишлист' : `Шаг ${step + 1} из ${steps.length}`}
        </span>
        {(current === 'when' || current === 'where') && (
          <button
            type="button"
            onClick={() => {
              if (current === 'when') { setDate(''); setTime('') } else { setPlace(''); setAddress('') }
              go(1)
            }}
            className="h-11 px-2.5 text-sm font-semibold text-muted-foreground"
          >
            {current === 'when' ? 'Дата не известна' : 'Решу позже'}
          </button>
        )}
      </header>

      <div className="flex shrink-0 gap-1 px-5" aria-hidden>
        {steps.map((s, i) => (
          <span key={s} className={cn('h-1 flex-1 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-7">
        {current === 'occasion' && (
          <section className="space-y-5">
            <StepTitle title="Какой повод?" hint="Пара вопросов — и соберём страницу с вашими данными" />
            <div className="grid grid-cols-2 gap-2.5">
              {occasions.map(id => {
                const meta = OCCASIONS[id] ?? { label: categories.find(c => c.id === id)?.name ?? id, hint: '', icon: Gift }
                const Icon = meta.icon
                const active = occasion === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickOccasion(id)}
                    aria-pressed={active}
                    className={cn(
                      'flex min-h-[112px] flex-col gap-2.5 rounded-2xl border p-3.5 text-left transition-colors',
                      active ? 'border-primary bg-primary/10' : 'bg-card',
                    )}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary">
                      <Icon size={22} aria-hidden />
                    </span>
                    <span>
                      <span className="block text-[15px] font-bold leading-tight">{meta.label}</span>
                      {meta.hint && <span className="mt-0.5 block text-xs text-muted-foreground">{meta.hint}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {current === 'who' && occasion && (
          <section className="space-y-5">
            <StepTitle title={WHO[occasion]?.title ?? 'Чей праздник?'} hint="Подставим в тексты страницы — потом их можно поправить" />
            <Field label={WHO[occasion]?.label ?? 'Имя'}>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={WHO[occasion]?.placeholder} maxLength={40} className="h-14 text-lg" autoFocus />
            </Field>
            {occasion === 'wedding' && (
              <Field label="Второе имя">
                <Input value={name2} onChange={e => setName2(e.target.value)} placeholder="Лев" maxLength={40} className="h-14 text-lg" />
              </Field>
            )}
            {asksAge(occasion) && (
              <Field label="Сколько исполняется" optional hint="Крупная цифра на обложке и в названии">
                <Input value={age} onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} inputMode="numeric" placeholder={occasion === 'kids' ? '7' : occasion === 'jubilee' ? '60' : '30'} className="h-14 text-lg" />
              </Field>
            )}
          </section>
        )}

        {current === 'title' && (
          <section className="space-y-5">
            <StepTitle title="Как назовём вишлист?" hint="Это первое, что увидят гости по ссылке" />
            <Field label="Название">
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={suggestions[0]} maxLength={60} className="h-14 text-lg" />
            </Field>
            <div className="space-y-2.5">
              <span className="text-[13px] text-muted-foreground">Или возьмите готовое</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => (
                  <Chip key={s} active={title === s} onClick={() => setTitle(s)}>{s}</Chip>
                ))}
              </div>
            </div>
          </section>
        )}

        {current === 'when' && (
          <section className="space-y-5">
            <StepTitle title="Когда праздник?" hint="Покажем гостям обратный отсчёт и кнопку «В календарь»" />
            <Field label="Дата">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-14 text-lg" />
            </Field>
            <Field label="Начало" optional>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} className="h-14 text-lg" />
            </Field>
          </section>
        )}

        {current === 'where' && (
          <section className="space-y-5">
            <StepTitle title="Где собираемся?" hint="Гости откроют адрес в картах прямо со страницы" />
            <div className="flex flex-wrap gap-2">
              {PLACE_CHIPS.map(c => <Chip key={c} active={place === c} onClick={() => setPlace(c)}>{c}</Chip>)}
            </div>
            <Field label="Место">
              <Input value={place} onChange={e => setPlace(e.target.value)} placeholder="Кафе, лофт, загородный дом" maxLength={120} className="h-14 text-lg" />
            </Field>
            <Field label="Адрес" optional>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Город, улица, дом" maxLength={200} className="h-14" />
            </Field>
          </section>
        )}

        {current === 'look' && (
          <section className="space-y-5">
            <StepTitle title="Выберите оформление" />
            <div className="grid grid-cols-2 gap-3">
              {shown.map(template => {
                const active = selected?.id === template.id
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setPickedId(template.id)}
                    aria-pressed={active}
                    className="flex flex-col gap-2 text-left"
                  >
                    <TemplatePreview
                      template={withAnswers(template)}
                      className={cn('h-[230px]', active ? 'ring-2 ring-primary' : 'ring-1 ring-border')}
                    />
                    <span className="px-0.5 text-sm font-bold">{template.name}</span>
                  </button>
                )
              })}
            </div>
            <dl className="divide-y rounded-2xl border bg-card">
              <Summary icon={CalendarDays} label="Когда" onEdit={() => jump('when')}>
                {date ? [formatEventDate(eventDateTime(date, time)), time].filter(Boolean).join(' · ') : 'Не указано'}
              </Summary>
              <Summary icon={MapPin} label="Где" onEdit={() => jump('where')}>
                {place.trim() || 'Не указано'}
              </Summary>
            </dl>
          </section>
        )}
      </main>

      {step > 0 && (
        <footer className="shrink-0 space-y-2.5 border-t px-5 pb-7 pt-3">
          {isLast ? (
            <>
              <Button className="h-[54px] w-full text-base font-bold" onClick={handleCreate} loading={pending} disabled={pending || (occasion !== LIST_OCCASION && !selected)}>
                Создать вишлист
              </Button>
              <p className="text-center text-xs text-muted-foreground">Блоки, тексты и цвета можно поменять потом</p>
            </>
          ) : (
            <Button className="h-[54px] w-full text-base font-bold" onClick={() => go(1)}>Дальше</Button>
          )}
        </footer>
      )}
      {step === 0 && (
        <p className="shrink-0 px-5 pb-7 pt-3 text-center text-[13px] text-muted-foreground">Займёт меньше минуты</p>
      )}
    </div>
  )
}

function StepTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{title}</h1>
      {hint && <p className="text-[15px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

function Field({ label, optional, hint, children }: { label: string; optional?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-[13px] font-semibold">
        {label}
        {optional && <span className="font-medium text-muted-foreground"> · по желанию</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
        active ? 'border-foreground bg-foreground text-background' : 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Summary({ icon: Icon, label, onEdit, children }: { icon: LucideIcon; label: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={18} className="shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-[15px] font-semibold">{children}</dd>
      </div>
      <button type="button" onClick={onEdit} className="h-10 px-2 text-sm font-semibold text-primary">Изменить</button>
    </div>
  )
}
