'use client'

import { useApiCreateFromSystemTemplate } from '@/api/system-template'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { TemplatePreview } from '@/app/wishlist/create/components/template-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { colorSchema, normalizeScheme } from '@/shared/constants'
import {
  FillKey, LIST_OCCASION, PAGE_BLOCKS, PageAnswers, PageBlockKey, QuizStep, asksAge, blockFilled, blockSummary, emptyAnswers,
  eventDateTime, hasQuestions, pagePayload, parseAge, personName, quizSteps, titleSuggestions,
} from '@/shared/create-quiz'
import { formatEventDate, pluralRu } from '@/shared/event-date'
import { SystemTemplate, SystemTemplateCategory } from '@/shared/types'
import { ArrowLeft, Baby, Cake, Gem, Gift, LucideIcon, PartyPopper, Star, X } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useMemo, useState } from 'react'
import { BLOCK_ICONS, BlockStep, BlocksPicker } from './quiz-block-steps'
import { Chip, Field, StepTitle } from './quiz-parts'

/**
 * Создание вишлиста с телефона — опросником по шагу на экран.
 *
 * Страница собирается из ответов: человек отмечает блоки и заполняет их,
 * а шаблон в конце даёт только оформление. Тексты-примеры шаблона в вишлист
 * не попадают — иначе у человека, который праздновал дома, на странице
 * оказывался бар из примера.
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

/** Порядок блоков в превью — примерно как они встанут на странице. */
const PREVIEW_ORDER: PageBlockKey[] = ['about', 'likes', 'stop', 'sizes', 'gifts', 'program', 'place', 'dress', 'contact', 'rsvp', 'playlist', 'guestbook']

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
  const [answers, setAnswers] = useState<PageAnswers>(() => emptyAnswers(initial?.category ?? null))
  const [pickedId, setPickedId] = useState<string | null>(initial?.id ?? null)

  const { mutate: createFromTemplate, isPending: templatePending } = useApiCreateFromSystemTemplate()
  const { mutate: createList, isPending: listPending } = useApiCreateConstructorWishlist()
  const pending = templatePending || listPending

  // Поводы — категории, в которых есть шаблоны, плюс «Просто список».
  const occasions = useMemo(() => [
    ...categories.filter(c => templates.some(t => t.category === c.id)).map(c => c.id),
    LIST_OCCASION,
  ], [categories, templates])

  const steps = quizSteps(occasion, answers.blocks)
  const index = Math.min(step, steps.length - 1)
  const current: QuizStep = steps[index]
  const isLast = index === steps.length - 1
  const shown = templates.filter(t => t.category === occasion)
  const selected = shown.find(t => t.id === pickedId) ?? shown[0] ?? null

  const person = { name, name2, age: parseAge(age) }
  const suggestions = titleSuggestions(occasion, person)
  const finalTitle = title.trim() || suggestions[0]
  const occasionMeta = (id: string): OccasionMeta =>
    OCCASIONS[id] ?? { label: categories.find(c => c.id === id)?.name ?? id, hint: '', icon: Gift }

  const go = (delta: number) => setStep(Math.max(0, Math.min(steps.length - 1, index + delta)))

  const pickOccasion = (id: string) => {
    // Другой повод — другой набор блоков по умолчанию. Уже введённое в
    // блоках не стираем: человек мог просто ошибиться поводом.
    if (id !== occasion) setAnswers(a => ({ ...a, blocks: emptyAnswers(id).blocks }))
    setOccasion(id)
    if (!templates.some(t => t.id === pickedId && t.category === id)) setPickedId(null)
    setStep(1)
  }

  const toggleBlock = (key: PageBlockKey) => setAnswers(a => ({
    ...a,
    blocks: a.blocks.includes(key) ? a.blocks.filter(k => k !== key) : [...a.blocks, key],
  }))

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
      title: finalTitle,
      name: personName(occasion, person) || undefined,
      event_date: eventDateTime(date, time),
      age: asksAge(occasion) ? person.age : undefined,
      page: pagePayload(answers),
    }, {
      onSuccess: res => onCreated(res.data.id),
      onError: error => onFailure(error.response?.status),
    })
  }

  // Миниатюра шаблона — только оформление: название и цифра человека,
  // а подзаголовок — его «пара слов», а не пример.
  const lookPreview = (template: SystemTemplate): SystemTemplate => {
    const number = asksAge(occasion) && person.age ? String(person.age) : null
    return {
      ...template,
      sampleTitle: finalTitle,
      blocks: template.blocks
        .filter(b => b.type === 'cover')
        .map(b => {
          if (b.view !== 'number') return b
          return number ? { ...b, data: { ...b.data, number } } : { ...b, view: 'center' }
        }),
    }
  }

  const chosenInOrder = PREVIEW_ORDER.filter(k => answers.blocks.includes(k))
  const hiddenCount = chosenInOrder.filter(k => hasQuestions(k) && !blockFilled(k, answers)).length
  const scheme = selected ? colorSchema.find(s => s.value === normalizeScheme(selected.colorScheme)) ?? colorSchema[0] : null
  const when = date ? [formatEventDate(eventDateTime(date, time)), time].filter(Boolean).join(', ') : ''

  return (
    // Поверх шапки сайта (у неё тоже z-50, но она раньше в разметке): на
    // шаге опросника ей нечего делать, а высоту она отнимает.
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-1 px-2">
        {index === 0 ? (
          <Link href="/wishlist" aria-label="Закрыть" className="flex h-11 w-11 items-center justify-center rounded-lg">
            <X size={20} aria-hidden />
          </Link>
        ) : (
          <button type="button" onClick={() => go(-1)} aria-label="Назад" className="flex h-11 w-11 items-center justify-center rounded-lg">
            <ArrowLeft size={20} aria-hidden />
          </button>
        )}
        <span className="flex-1 text-[13px] text-muted-foreground">
          {index === 0 ? 'Новый вишлист' : `Шаг ${index + 1} из ${steps.length}`}
        </span>
        {current === 'when' && (
          <button type="button" onClick={() => { setDate(''); setTime(''); go(1) }} className="h-11 px-2.5 text-sm font-semibold text-muted-foreground">
            Дата не известна
          </button>
        )}
        {hasQuestions(current as PageBlockKey) && (
          <button type="button" onClick={() => go(1)} className="h-11 px-2.5 text-sm font-semibold text-muted-foreground">
            Заполню потом
          </button>
        )}
      </header>

      <div className="flex shrink-0 gap-1 px-5" aria-hidden>
        {steps.map((s, i) => (
          <span key={s} className={cn('h-1 flex-1 rounded-full', i <= index ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-7">
        {current === 'occasion' && (
          <section className="space-y-5">
            <StepTitle title="Какой повод?" hint="Пара вопросов — и соберём страницу из ваших ответов" />
            <div className="grid grid-cols-2 gap-2.5">
              {occasions.map(id => {
                const meta = occasionMeta(id)
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
            <StepTitle title={WHO[occasion]?.title ?? 'Чей праздник?'} hint="Подставим в название — потом его можно поправить" />
            <Field label={WHO[occasion]?.label ?? 'Имя'}>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={WHO[occasion]?.placeholder} maxLength={40} className="h-14 text-lg" />
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
                {suggestions.map(s => <Chip key={s} active={title === s} onClick={() => setTitle(s)}>{s}</Chip>)}
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

        {current === 'blocks' && occasion && (
          <BlocksPicker occasionLabel={occasionMeta(occasion).label} blocks={answers.blocks} onToggle={toggleBlock} />
        )}

        {hasQuestions(current as PageBlockKey) && (
          <BlockStep
            step={current as FillKey}
            blocks={answers.blocks}
            occasion={occasion}
            answers={answers}
            onChange={setAnswers}
          />
        )}

        {current === 'look' && (
          <section className="space-y-5">
            <StepTitle title="Ваша страница" />
            <div className="space-y-2 rounded-2xl border bg-card p-4">
              <div>
                <p className="text-xs text-muted-foreground">{[selected?.occasion, when].filter(Boolean).join(' · ')}</p>
                <p className="text-2xl font-extrabold leading-tight tracking-tight" style={scheme ? { color: scheme.colors[1] } : undefined}>
                  {finalTitle}
                </p>
              </div>
              {chosenInOrder.map(key => {
                const Icon = BLOCK_ICONS[key]
                const hidden = hasQuestions(key) && !blockFilled(key, answers)
                const label = PAGE_BLOCKS.find(b => b.key === key)?.label ?? key
                return (
                  <div
                    key={key}
                    className={cn('flex gap-3 rounded-xl px-3 py-2.5', hidden ? 'border border-dashed' : 'bg-muted/60')}
                  >
                    <Icon size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                        {label}{hidden && ' · скрыт'}
                      </p>
                      <p className={cn('text-sm leading-snug line-clamp-2', hidden && 'text-muted-foreground')}>
                        {hidden ? 'Гости не увидят, пока не заполните' : blockSummary(key, answers)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2.5">
              <span className="block text-[13px] font-semibold">Оформление</span>
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
                        template={lookPreview(template)}
                        className={cn('h-[150px]', active ? 'ring-2 ring-primary' : 'ring-1 ring-border')}
                      />
                      <span className="px-0.5 text-sm font-bold">{template.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      {index > 0 && (
        <footer className="shrink-0 space-y-2.5 border-t px-5 pb-7 pt-3">
          {isLast ? (
            <>
              <Button className="h-[54px] w-full text-base font-bold" onClick={handleCreate} loading={pending} disabled={pending || (occasion !== LIST_OCCASION && !selected)}>
                Создать вишлист
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                {occasion === LIST_OCCASION
                  ? 'Подарки добавите сразу после создания'
                  : hiddenCount > 0
                    ? 'Незаполненные блоки скрыты от гостей — допишете в редакторе'
                    : 'Блоки, тексты и цвета можно поменять потом'}
              </p>
            </>
          ) : (
            <Button className="h-[54px] w-full text-base font-bold" onClick={() => go(1)}>
              {current === 'blocks' ? nextLabel(answers.blocks) : 'Дальше'}
            </Button>
          )}
        </footer>
      )}
      {index === 0 && (
        <p className="shrink-0 px-5 pb-7 pt-3 text-center text-[13px] text-muted-foreground">Займёт пару минут</p>
      )}
    </div>
  )
}

/** «Дальше · 3 вопроса» — человек видит, сколько ещё отвечать. */
function nextLabel(blocks: PageBlockKey[]): string {
  const n = blocks.filter(hasQuestions).length
  return n ? `Дальше · ${n} ${pluralRu(n, ['вопрос', 'вопроса', 'вопросов'])}` : 'Дальше'
}

