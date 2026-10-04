'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  DRESS_SWATCHES, FILL_ORDER, FillKey, MAX_COLORS, MAX_PROGRAM, PAGE_BLOCKS, PAGE_GROUPS, PageAnswers, PageBlockKey,
  QuizOccasion, TAG_OFFERS, aboutPhrases, addTag, hasQuestions,
} from '@/shared/create-quiz'
import {
  Ban, BookOpen, CheckCheck, Clock, Gift, Heart, LucideIcon, MapPin, MessageSquareText, Music, Plus, Ruler, Shirt, UserRound, X,
} from 'lucide-react'
import * as React from 'react'
import { useState } from 'react'
import { Chip, Field, StepTitle } from './quiz-parts'

/**
 * Шаг «Что будет на странице» и экраны вопросов по блокам. Всё, что здесь
 * вводится, и только это попадает на страницу: тексты-примеры шаблона
 * остаются подсказками в полях.
 */

export const BLOCK_ICONS: Record<PageBlockKey, LucideIcon> = {
  about: MessageSquareText, place: MapPin, program: Clock, dress: Shirt, contact: UserRound,
  gifts: Gift, likes: Heart, stop: Ban, sizes: Ruler,
  rsvp: CheckCheck, playlist: Music, guestbook: BookOpen,
}

export const BLOCK_LABELS = Object.fromEntries(PAGE_BLOCKS.map(b => [b.key, b.label])) as Record<PageBlockKey, string>

export function BlocksPicker({ occasionLabel, blocks, onToggle }: {
  occasionLabel: string
  blocks: PageBlockKey[]
  onToggle: (key: PageBlockKey) => void
}) {
  return (
    <section className="space-y-5">
      <StepTitle
        title="Что будет на странице?"
        hint={`Отметили, что обычно бывает на празднике «${occasionLabel}». Лишнее снимите — по каждому блоку спросим пару слов`}
      />
      {PAGE_GROUPS.map(group => (
        <div key={group.id} className="space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{group.title}</span>
          <div className="flex flex-wrap gap-1.5">
            {PAGE_BLOCKS.filter(b => b.group === group.id).map(b => {
              const Icon = BLOCK_ICONS[b.key]
              const on = blocks.includes(b.key)
              const locked = b.key === 'gifts'
              return (
                <Chip key={b.key} active={on} onClick={() => !locked && onToggle(b.key)} className="pl-3 pr-3.5">
                  <Icon size={17} aria-hidden />
                  {b.label}
                  {locked && <span className="text-[11px] font-semibold opacity-60">всегда</span>}
                  {on && !locked && !hasQuestions(b.key) && <span className="text-[11px] font-semibold opacity-60">без вопросов</span>}
                </Chip>
              )
            })}
          </div>
        </div>
      ))}
    </section>
  )
}

const FILL_COPY: Record<FillKey, { title: string; hint: string }> = {
  about: { title: 'Пара слов гостям', hint: 'Встанет под названием на обложке' },
  place: { title: 'Где собираемся?', hint: 'Гости откроют адрес в картах прямо со страницы' },
  program: { title: 'Как пройдёт праздник?', hint: 'Пара пунктов — гостям проще спланировать время' },
  dress: { title: 'Цвета праздника', hint: `Выберите до ${MAX_COLORS} — гости подберут наряд` },
  contact: { title: 'Кому писать с вопросами?', hint: 'Чтобы гости не дёргали виновника праздника' },
  likes: { title: 'Что вы любите?', hint: 'Подскажет тем, кто хочет угадать с подарком' },
  stop: { title: 'Что не дарить?', hint: 'Покажем зачёркнутым — гости не повторят ошибку' },
  sizes: { title: 'Ваши размеры', hint: 'Если кто-то решит подарить одежду или обувь' },
}

export function BlockStep({ step, blocks, occasion, answers, onChange }: {
  step: FillKey
  blocks: PageBlockKey[]
  occasion: QuizOccasion | null
  answers: PageAnswers
  onChange: (next: PageAnswers) => void
}) {
  const Icon = BLOCK_ICONS[step]
  const asked = FILL_ORDER.filter(k => blocks.includes(k))
  const set = <K extends keyof PageAnswers>(key: K, value: PageAnswers[K]) => onChange({ ...answers, [key]: value })

  return (
    <section className="space-y-5">
      <StepTitle
        kicker={<><Icon size={15} aria-hidden />Блок «{BLOCK_LABELS[step]}» · {asked.indexOf(step) + 1} из {asked.length}</>}
        title={FILL_COPY[step].title}
        hint={FILL_COPY[step].hint}
      />

      {step === 'about' && (
        <>
          <Textarea
            value={answers.about}
            onChange={e => set('about', e.target.value)}
            placeholder="Напишите, как зовёте гостей"
            maxLength={500}
            rows={4}
            className="text-base"
            aria-label="Пара слов гостям"
          />
          <div className="space-y-2">
            <span className="block text-[13px] text-muted-foreground">Начать с готовой фразы</span>
            {aboutPhrases(occasion).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => set('about', p)}
                className="block w-full rounded-xl border bg-card px-3.5 py-3 text-left text-sm leading-snug text-muted-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        </>
      )}

      {step === 'place' && (
        <>
          <div className="flex flex-wrap gap-2">
            {['Дома', 'В кафе', 'На природе'].map(c => (
              <Chip key={c} active={answers.place.name === c} onClick={() => set('place', { ...answers.place, name: c })}>{c}</Chip>
            ))}
          </div>
          <Field label="Место">
            <Input value={answers.place.name} onChange={e => set('place', { ...answers.place, name: e.target.value })} placeholder="Кафе, лофт, загородный дом" maxLength={200} className="h-14 text-lg" />
          </Field>
          <Field label="Адрес" optional>
            <Input value={answers.place.address} onChange={e => set('place', { ...answers.place, address: e.target.value })} placeholder="Город, улица, дом" maxLength={200} className="h-14" />
          </Field>
          <Field label="Как найти" optional>
            <Input value={answers.place.note} onChange={e => set('place', { ...answers.place, note: e.target.value })} placeholder="Домофон 12, третий этаж" maxLength={200} className="h-14" />
          </Field>
        </>
      )}

      {step === 'program' && (
        <>
          <div className="space-y-2">
            {answers.program.map((row, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  aria-label="Время"
                  value={row.t}
                  onChange={e => set('program', answers.program.map((r, j) => j === i ? { ...r, t: e.target.value } : r))}
                  placeholder={['19:00', '20:30', '22:00'][i] ?? '00:00'}
                  maxLength={20}
                  className="h-12 w-24 shrink-0 text-base font-semibold"
                />
                <Input
                  aria-label="Что будет"
                  value={row.v}
                  onChange={e => set('program', answers.program.map((r, j) => j === i ? { ...r, v: e.target.value } : r))}
                  placeholder={['Собираемся', 'Торт и тосты', 'Танцы'][i] ?? 'Что будет'}
                  maxLength={150}
                  className="h-12 min-w-0 flex-1 text-base"
                />
              </div>
            ))}
          </div>
          {answers.program.length < MAX_PROGRAM && (
            <button
              type="button"
              onClick={() => set('program', [...answers.program, { t: '', v: '' }])}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-semibold text-muted-foreground"
            >
              <Plus size={16} aria-hidden />Ещё пункт
            </button>
          )}
        </>
      )}

      {step === 'dress' && (
        <>
          <div className="grid grid-cols-5 gap-3">
            {DRESS_SWATCHES.map(c => {
              const on = answers.dress.colors.some(x => x.hex === c.hex)
              const toggle = () => set('dress', {
                ...answers.dress,
                colors: on ? answers.dress.colors.filter(x => x.hex !== c.hex) : [...answers.dress.colors, c].slice(-MAX_COLORS),
              })
              return (
                <button key={c.hex} type="button" onClick={toggle} aria-pressed={on} className="flex flex-col items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className={cn('h-12 w-12 rounded-full border', on && 'ring-2 ring-primary ring-offset-2 ring-offset-background')}
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              )
            })}
          </div>
          <Field label="Подпись" optional>
            <Input value={answers.dress.note} onChange={e => set('dress', { ...answers.dress, note: e.target.value })} placeholder="Коктейльный, без белого" maxLength={200} className="h-14" />
          </Field>
        </>
      )}

      {step === 'contact' && (
        <>
          <Field label="Кто отвечает на вопросы">
            <Input value={answers.contact.name} onChange={e => set('contact', { ...answers.contact, name: e.target.value })} placeholder="Оля, сестра" maxLength={100} className="h-14 text-lg" />
          </Field>
          <Field label="Телеграм или телефон">
            <Input value={answers.contact.way} onChange={e => set('contact', { ...answers.contact, way: e.target.value })} placeholder="@olya или +7 900 000-00-00" maxLength={100} className="h-14" />
          </Field>
        </>
      )}

      {(step === 'likes' || step === 'stop') && (
        <TagsStep
          list={answers[step]}
          strike={step === 'stop'}
          offers={TAG_OFFERS[step]}
          onChange={list => set(step, list)}
        />
      )}

      {step === 'sizes' && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            {([['clothes', 'Одежда', 'M · 48'], ['shoes', 'Обувь', '42'], ['height', 'Рост', '180'], ['ring', 'Кольцо', '19']] as const).map(([key, label, hint]) => (
              <Field key={key} label={label}>
                <Input
                  value={answers.sizes[key]}
                  onChange={e => set('sizes', { ...answers.sizes, [key]: e.target.value })}
                  placeholder={hint}
                  maxLength={30}
                  className="h-14 text-lg font-bold"
                />
              </Field>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Пустые поля на страницу не попадут</p>
        </>
      )}
    </section>
  )
}

function TagsStep({ list, strike, offers, onChange }: {
  list: string[]
  strike: boolean
  offers: string[]
  onChange: (list: string[]) => void
}) {
  const [draft, setDraft] = useState('')
  const add = () => { onChange(addTag(list, draft)); setDraft('') }

  return (
    <>
      {list.length > 0 && (
        <div className="flex flex-wrap gap-2 rounded-2xl border bg-card p-3">
          {list.map(item => (
            <button
              key={item}
              type="button"
              onClick={() => onChange(list.filter(x => x !== item))}
              aria-label={`Убрать «${item}»`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-foreground py-1 pl-3 pr-2.5 text-sm font-bold text-background"
            >
              <span className={cn(strike && 'line-through')}>{item}</span>
              <X size={14} aria-hidden />
            </button>
          ))}
        </div>
      )}
      <form
        className="flex gap-2"
        onSubmit={e => { e.preventDefault(); add() }}
      >
        <Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Своё — например, «книги»" maxLength={100} className="h-12 min-w-0 flex-1 text-base" aria-label="Свой вариант" />
        <button type="submit" aria-label="Добавить" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background">
          <Plus size={20} aria-hidden />
        </button>
      </form>
      <div className="space-y-2">
        <span className="block text-[13px] text-muted-foreground">Частое — нажмите, чтобы добавить</span>
        <div className="flex flex-wrap gap-2">
          {offers.filter(o => !list.includes(o)).map(o => (
            <button
              key={o}
              type="button"
              onClick={() => onChange(addTag(list, o))}
              className="min-h-10 rounded-full border px-3.5 text-sm font-semibold text-muted-foreground"
            >
              + {o}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
