import { TEMPLATES } from '@/app/(landing)/components/templates-section'
import { EXAMPLE, ExampleBadge, MiniCard, MiniLabel, MiniTitle } from '@/app/(landing)/components/landing-ui'
import { cn } from '@/lib/utils'
import { Check, Copy, Eye, ImagePlus, ListChecks, Lock, Music, Plus, Search, Share2, Vote } from 'lucide-react'
import { DRESS_PRESETS } from '@/shared/constants'
import * as React from 'react'

/**
 * Мокапы шагов «Как это работает». Интерфейс сервиса — на токенах темы сайта,
 * а куски страницы праздника — в `demo-scheme`, как примеры на главной: в
 * светлой теме они тоже светлые.
 */

const PAGE = 'demo-scheme wishlist-page look-font-accent look-pattern-stars bg-background text-foreground'

function Frame({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative overflow-hidden rounded-sheet border bg-card shadow-overlay', EXAMPLE, className)} aria-hidden>
      <ExampleBadge className="absolute bottom-3 left-3" />
      {children}
    </div>
  )
}

function Field({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5 text-caption font-bold text-muted-foreground">
      {label}
      <span className={cn('flex h-[42px] items-center rounded-control border bg-background px-3 text-body-sm font-medium', muted ? 'text-muted-foreground' : 'text-foreground')}>{value}</span>
    </div>
  )
}

function Toggle() {
  return <span className="relative h-5 w-[34px] shrink-0 rounded-full bg-primary"><span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" /></span>
}

/** 01 — выбор шаблона: сетка заготовок и панель «Создать по шаблону». */
export function TemplatePickerMock() {
  return (
    <Frame className="grid md:h-[500px] md:grid-cols-[minmax(0,1fr)_230px]">
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-wrap gap-2 text-label font-semibold">
          <span className="flex h-8 items-center rounded-full bg-primary px-3.5 font-bold text-primary-foreground">Все · 8</span>
          {['Дети', 'Взрослые'].map(c => <span key={c} className="flex h-8 items-center rounded-full border px-3.5">{c}</span>)}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.slice(0, 4).map((t, i) => (
            <div key={t.name} className={cn('overflow-hidden rounded-card', i === 0 ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : 'border')}>
              <div className={cn(t.className, 'flex h-[112px] items-center justify-center overflow-hidden bg-background text-foreground md:h-[150px]')}>
                <div className="flex scale-[0.72] flex-col items-center gap-1 text-center">{t.cover}</div>
              </div>
              <div className="bg-muted/40 px-3 py-2 text-caption font-bold">{t.name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden flex-col gap-3.5 border-l bg-muted/30 px-5 py-6 md:flex">
        <span className="text-title-xs font-extrabold">ДР мальчика</span>
        <span className="-mt-2 text-caption text-muted-foreground">Полночь · 9 блоков</span>
        <Field label="Для кого" value="Тёме — семь!" />
        <Field label="Дата праздника" value="18 октября, 12:00" />
        <span className="flex-1" />
        <span className="flex h-[46px] items-center justify-center rounded-control-lg bg-gradient-to-r from-brand-sky to-brand-violet text-body font-bold text-white">Создать по шаблону</span>
        <span className="text-center text-micro text-muted-foreground">Тексты — пример, поправьте под себя</span>
      </div>
    </Frame>
  )
}

/** 02 — выделенный блок на странице и его поля в панели справа. */
export function BlockPanelMock() {
  return (
    <Frame className="grid md:h-[500px] md:grid-cols-[minmax(0,1fr)_250px]">
      <div className={cn(PAGE, 'hidden flex-col gap-4 px-7 py-8 md:flex')}>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-caption font-bold text-primary">суббота, 18 октября · 12:00</span>
          <span className="heading text-title-lg font-extrabold">Тёме — семь!</span>
        </div>
        <MiniCard className="relative mt-3 outline outline-2 outline-offset-4 outline-brand-cyan">
          <span className="absolute -top-[18px] left-2.5 rounded-control-lg bg-brand-cyan px-2 py-0.5 text-micro font-extrabold text-brand-ink">Список · Время</span>
          <MiniLabel>Программа</MiniLabel>
          <MiniTitle className="text-lead">Как пройдёт праздник</MiniTitle>
          <span className="text-body-sm"><b className="text-primary">12:00</b>&nbsp; Сбор и квест</span>
          <span className="text-body-sm"><b className="text-primary">13:30</b>&nbsp; Торт и свечи</span>
          <span className="text-body-sm"><b className="text-primary">14:00</b>&nbsp; Телескоп</span>
        </MiniCard>
        <MiniCard><MiniLabel>Место</MiniLabel><MiniTitle>Детский клуб «Орбита»</MiniTitle><MiniLabel>ул. Ленина, 24</MiniLabel></MiniCard>
      </div>
      <div className="flex flex-col gap-3.5 bg-card p-5 md:border-l">
        <div className="flex gap-4 border-b pb-3 text-label font-bold">
          <span className="-mb-3 border-b-2 border-primary pb-2.5">Блок</span>
          <span className="text-muted-foreground">Доступ</span>
        </div>
        <Field label="Подпись" value="Программа" />
        <Field label="Заголовок" value="Как пройдёт праздник" />
        <div className="flex flex-col gap-1.5 text-caption font-bold text-muted-foreground">
          Пункты · время и событие
          {[['12:00', 'Сбор и квест'], ['13:30', 'Торт и свечи'], ['14:00', 'Телескоп']].map(([t, v], i) => (
            <div key={t} className="grid grid-cols-[64px_1fr] gap-1.5">
              <span className="flex h-9 items-center rounded-control border bg-background px-2.5 text-label font-medium text-foreground">{t}</span>
              <span className={cn('flex h-9 items-center rounded-control border bg-background px-2.5 text-label font-medium text-foreground', i === 2 && 'border-primary')}>{v}</span>
            </div>
          ))}
        </div>
        <span className="mt-auto text-micro text-muted-foreground">Сохранено · Ctrl + Z — отменить</span>
      </div>
    </Frame>
  )
}

function MenuItem({ icon: Icon, title, text, tone, active }: { icon: typeof Vote; title: string; text: string; tone: string; active?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-control px-2.5 py-2', active && 'bg-muted')}>
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-tag', tone)}><Icon size={16} /></span>
      <span><b className="block text-body-sm">{title}</b><span className="text-caption text-muted-foreground">{text}</span></span>
    </div>
  )
}

/** 03 — ряд 2:1, «+» между блоками и меню блоков. Только для компьютера. */
export function BlocksMock() {
  return (
    <Frame className="relative h-[520px]">
      <div className={cn(PAGE, 'flex h-full flex-col gap-3.5 px-9 py-8')}>
        <div className="relative grid grid-cols-[2fr_1fr] gap-3">
          <MiniCard>
            <MiniLabel>Программа</MiniLabel><MiniTitle>Как пройдёт праздник</MiniTitle>
            <span className="text-label"><b className="text-primary">12:00</b>&nbsp; Сбор и квест</span>
            <span className="text-label"><b className="text-primary">13:30</b>&nbsp; Торт</span>
          </MiniCard>
          <MiniCard>
            <MiniLabel>Дресс-код</MiniLabel>
            <div className="flex gap-1.5">{[DRESS_PRESETS[0], DRESS_PRESETS[8], DRESS_PRESETS[10]].map(c => <span key={c} className="h-[26px] w-[26px] rounded-full border" style={{ background: c }} />)}</div>
            <MiniLabel>Космос</MiniLabel>
          </MiniCard>
          <span className="absolute -bottom-1.5 -top-1.5 left-[66.4%] w-0.5 rounded-xs bg-brand-cyan" />
          <span className="absolute left-[66.4%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-control-lg bg-brand-cyan px-2 py-0.5 text-caption font-extrabold text-brand-ink">2 : 1</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="h-px flex-1 bg-border" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-cyan bg-background text-brand-cyan"><Plus size={15} /></span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <MiniCard className="opacity-45"><MiniLabel>Вишлист</MiniLabel><MiniTitle>Что подарить Тёме</MiniTitle></MiniCard>
      </div>
      <div className="absolute left-1/2 top-[170px] flex w-[340px] -translate-x-1/2 flex-col gap-1 rounded-card border bg-popover p-3 text-popover-foreground shadow-overlay">
        <div className="mb-1.5 flex h-10 items-center gap-2 rounded-control border bg-background px-3 text-body-sm text-muted-foreground"><Search size={15} />Найти блок</div>
        <MenuItem icon={Vote} title="Голосование" text="Гости выбирают вариант" tone="bg-tone-cyan/15 text-tone-cyan" active />
        <MenuItem icon={ListChecks} title="Ответ гостя" text="Придёт, +1, дети, меню" tone="bg-tone-violet/15 text-tone-violet" />
        <MenuItem icon={Music} title="Плейлист" text="Треки от гостей" tone="bg-tone-pink/15 text-tone-pink" />
      </div>
    </Frame>
  )
}

/** 04 — вишлист с главной мечтой и форма нового подарка. */
export function GiftFormMock() {
  return (
    <Frame className="grid md:h-[520px] md:grid-cols-[minmax(0,1fr)_280px]">
      <div className={cn(PAGE, 'hidden content-start gap-3 p-6 md:grid md:grid-cols-2')}>
        <div className="col-span-2 flex flex-col overflow-hidden rounded-card border bg-card">
          <div className="relative flex h-[150px] items-center justify-center bg-secondary">
            <span className="heading text-display font-extrabold text-primary">Н</span>
            <span className="absolute left-2.5 top-2.5 whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-micro font-extrabold text-primary-foreground">★ Главная мечта</span>
          </div>
          <div className="flex items-center gap-3 p-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-1"><MiniTitle className="truncate">Раскопки динозавра</MiniTitle><b className="text-body-sm text-primary">1 900 ₽</b></div>
            <span className="flex h-9 shrink-0 px-3 items-center justify-center rounded-tag bg-primary text-label font-bold text-primary-foreground">Забронировать</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-card border bg-card"><div className="h-[80px] bg-secondary" /><div className="truncate p-3 text-label font-bold">Телескоп<br /><span className="text-primary">5 900 ₽</span></div></div>
        <div className="flex flex-col items-center justify-center gap-1.5 rounded-card border-[1.5px] border-dashed text-label font-bold text-muted-foreground"><Plus size={20} />Добавить подарок</div>
      </div>
      <div className="flex flex-col gap-3 bg-card p-5 md:border-l">
        <span className="text-title-xs font-extrabold">Новый подарок</span>
        <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-control-lg border-[1.5px] border-dashed text-label text-muted-foreground">
          <ImagePlus size={20} />Перетащите фото или Ctrl + V
        </div>
        <Field label="Название" value="Детский телескоп" />
        <div className="grid grid-cols-2 gap-2.5"><Field label="Цена" value="5 900 ₽" /><Field label="Ссылка" value="ozon.ru/…" muted /></div>
        <div className="flex items-center justify-between text-body-sm font-semibold">Главная мечта<Toggle /></div>
        <span className="flex-1" />
        <span className="flex h-11 items-center justify-center rounded-control-lg bg-gradient-to-r from-brand-sky to-brand-violet text-body font-bold text-white">Добавить</span>
      </div>
    </Frame>
  )
}

/** 05 — ссылка готова, рядом — как она выглядит в чате. */
export function ShareMock() {
  return (
    <div className="flex items-start gap-5" aria-hidden>
      <Frame className="flex flex-1 flex-col gap-4 p-5 sm:mt-16 md:p-7">
        <span className="text-title-sm font-extrabold">Страница готова</span>
        <span className="-mt-1 text-body text-muted-foreground">Отправьте ссылку гостям — бронь и ответы появятся у вас</span>
        <div className="flex gap-2">
          <span className="flex h-12 min-w-0 flex-1 items-center truncate rounded-control border bg-background px-3 text-body">prosto-namekni.ru/s/<b>teme-7</b></span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control bg-muted"><Copy size={16} /></span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <span className="flex h-12 items-center justify-center gap-2 rounded-control-lg bg-gradient-to-r from-brand-sky to-brand-violet text-body-sm font-bold text-white"><Share2 size={16} />Поделиться</span>
          <span className="flex h-12 items-center justify-center gap-2 rounded-control-lg border text-body-sm font-semibold"><Eye size={16} />Как увидят гости</span>
        </div>
      </Frame>
      <div className="hidden h-[480px] w-[220px] shrink-0 flex-col gap-2.5 rounded-sheet border-8 border-border bg-background px-3.5 py-4 text-caption shadow-overlay sm:flex">
        <div className="max-w-[170px] self-start rounded-control-lg rounded-bl-xs bg-muted px-3 py-2.5 leading-snug">Друзья, у Тёмы день рождения! Всё тут 👇</div>
        <div className="demo-scheme wishlist-page look-font-accent w-[170px] self-start overflow-hidden rounded-control-lg border bg-card text-foreground">
          <div className="flex h-20 flex-col items-center justify-center"><span className="heading text-title-lg font-extrabold leading-none text-primary">7</span><span className="heading text-micro font-extrabold">Тёме — семь!</span></div>
          <div className="border-t px-2.5 py-2 text-micro text-muted-foreground">prosto-namekni.ru</div>
        </div>
        <div className="self-end rounded-control-lg rounded-br-xs bg-brand-chat px-3 py-2 text-white">Придём! 🎉</div>
        <div className="self-end rounded-control-lg rounded-br-xs bg-brand-chat px-3 py-2 text-white">Забронировали телескоп 🤫</div>
      </div>
    </div>
  )
}

function Stat({ value, label, tone }: { value: React.ReactNode; label: string; tone?: string }) {
  return <div><div className={cn('font-unbounded text-title-lg font-extrabold', tone)}>{value}</div><span className="text-caption text-muted-foreground">{label}</span></div>
}

function Line({ name, value, muted }: { name: string; value: React.ReactNode; muted?: boolean }) {
  return <div className="flex justify-between gap-3"><span>{name}</span><span className={cn('flex items-center gap-1.5 whitespace-nowrap', muted ? 'text-muted-foreground' : 'text-primary')}>{value}</span></div>
}

/** 06 — ответы гостей видны, а кто что дарит — нет. */
export function ResponsesMock() {
  const taken = <><Lock size={13} />занято</>
  return (
    <Frame className="grid gap-4 p-5 sm:grid-cols-2 md:p-6">
      <div className="flex items-center justify-between gap-3 sm:col-span-2">
        <span className="text-title-xs font-extrabold">Тёме — семь!</span>
        <span className="rounded-full border px-3 py-1 text-caption font-semibold">до праздника 14 дней</span>
      </div>
      <div className="flex flex-col gap-3 rounded-card border bg-muted/40 p-4">
        <span className="text-label font-bold text-muted-foreground">Ответ гостя</span>
        <div className="flex gap-5"><Stat value="9" label="придут" tone="text-primary" /><Stat value="3" label="ребёнка" /><Stat value="2" label="не смогут" tone="text-muted-foreground" /></div>
        <div className="flex flex-col gap-2 text-body-sm">
          <Line name="Аня и Миша" value="+1 · 1 ребёнок" />
          <Line name="Бабушка Валя" value="придёт" />
          <Line name="Лёша" value="не сможет" muted />
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-card border bg-muted/40 p-4">
        <span className="text-label font-bold text-muted-foreground">Подарки</span>
        <Stat value={<>4 <span className="text-lead text-muted-foreground">из 9</span></>} label="уже заняты" />
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[44%] bg-gradient-to-r from-brand-sky to-brand-violet" /></div>
        <div className="flex flex-col gap-2 text-body-sm">
          <Line name="Детский телескоп" value={taken} muted />
          <Line name="Конструктор «Вулкан»" value={taken} muted />
          <Line name="Футбольный мяч" value="свободен" />
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-control-lg border border-tone-pink/30 bg-tone-pink/10 px-4 py-3.5 text-body-sm text-tone-pink sm:col-span-2">
        <Lock size={18} className="shrink-0" />Кто что дарит — не показываем даже вам. Сюрприз остаётся сюрпризом
      </div>
    </Frame>
  )
}

export function CheckItem({ children }: { children: React.ReactNode }) {
  return <li className="flex items-start gap-2.5 text-body leading-snug text-foreground/85 md:text-lead"><Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />{children}</li>
}
