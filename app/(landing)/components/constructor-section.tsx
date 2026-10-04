import { Columns2, ListTree, MapPin, Monitor, Palette, Plus, Undo2 } from 'lucide-react'
import * as React from 'react'
import { Container, EXAMPLE, ExampleBadge, MiniCard, MiniLabel, MiniTitle, Pill, SectionTitle } from './landing-ui'

const FACTS = [
  { icon: Plus, title: 'Вставка между блоками', text: 'С поиском и превью блока' },
  { icon: Columns2, title: 'Ряды до трёх колонок', text: 'Пропорции 1:2, 1:1, 2:1' },
  { icon: Undo2, title: 'Отменить любую правку', text: 'Ctrl + Z, сохранение само' },
  { icon: Monitor, title: 'Проверка на телефоне', text: 'Ряды встанут друг под другом' },
]

/**
 * Конструктор глазами владельца: выделенный блок, разделитель колонок,
 * «+» между блоками, перетаскивание к краю соседа и панель «Оформление».
 *
 * На телефоне секции нет: конструктор там не открывается, и показывать его
 * человеку с телефона — обещать то, чего он не получит.
 */
export function ConstructorSection() {
  return (
    <section className="hidden border-y bg-muted/30 py-24 md:block">
      <Container className="space-y-10">
        <SectionTitle
          eyebrow="Конструктор"
          title="Страница, а не анкета"
          lead="Выделите блок и правьте его в панели справа — страница рядом сразу показывает, как её увидят гости. Тяните блок между другими — встанет ниже, к краю соседа — соберёт с ним ряд."
        />
        <EditorMock />
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {FACTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary/15 text-primary"><Icon size={17} aria-hidden /></span>
              <div><div className="font-extrabold">{title}</div><p className="text-body-sm text-muted-foreground">{text}</p></div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative h-[18px] w-8 rounded-full ${on ? 'bg-primary' : 'bg-muted'}`}>
      <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white ${on ? 'right-0.5' : 'left-0.5'}`} />
    </span>
  )
}

function EditorMock() {
  return (
    <div className={`relative grid h-[640px] grid-cols-[56px_minmax(0,1fr)_300px] overflow-hidden rounded-sheet border bg-background shadow-overlay ${EXAMPLE}`} aria-hidden>
      <ExampleBadge className="absolute bottom-4 left-1/2 -translate-x-1/2">Пример редактора</ExampleBadge>
      <div className="flex flex-col items-center gap-2.5 border-r pt-4">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-control-lg bg-brand-violet text-white"><Plus size={18} /></span>
        <span className="flex h-[38px] w-[38px] items-center justify-center text-muted-foreground"><ListTree size={18} /></span>
        <span className="flex h-[38px] w-[38px] items-center justify-center text-muted-foreground"><Palette size={18} /></span>
      </div>

      <div className="bg-muted/40 px-10 pt-6">
        <div className="demo-scheme wishlist-page look-font-accent look-pattern-stars flex h-[620px] flex-col gap-4 rounded-t-card bg-background p-6 text-foreground">
          <div className="text-center"><span className="heading text-title-lg font-extrabold">Тёме — семь!</span></div>
          <div className="relative grid grid-cols-[2fr_1fr] gap-3.5">
            <MiniCard className="relative outline outline-2 outline-offset-4 outline-brand-cyan">
              <span className="absolute -top-[18px] left-2.5 rounded-control-lg bg-brand-cyan px-2 py-0.5 text-micro font-extrabold text-brand-ink">Список · Теги</span>
              <MiniLabel>Стоп-лист</MiniLabel><MiniTitle>Уже есть — не дарите</MiniTitle>
              <div className="flex flex-wrap gap-1.5"><Pill strike>Самокат</Pill><Pill strike>Фломастеры</Pill></div>
            </MiniCard>
            <MiniCard><MiniLabel>Место</MiniLabel><MiniTitle>«Орбита»</MiniTitle><MiniLabel>ул. Ленина, 24</MiniLabel></MiniCard>
            <span className="absolute -bottom-1.5 -top-1.5 left-[66.4%] w-0.5 rounded-xs bg-brand-cyan" />
            <span className="absolute left-[66.4%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-control-lg bg-brand-cyan px-2 py-0.5 text-caption font-extrabold text-brand-ink">2 : 1</span>
          </div>
          <div className="flex items-center gap-2.5 text-primary">
            <span className="h-px flex-1 bg-border" />
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-brand-cyan text-brand-cyan"><Plus size={15} /></span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="relative">
            <MiniCard className="pr-24"><MiniLabel>Ответ гостя</MiniLabel><MiniTitle>Придёте?</MiniTitle><div className="flex justify-between text-label"><span>Сколько детей</span><span>− 1 +</span></div></MiniCard>
            <span className="absolute -right-2.5 bottom-0 top-0 w-1.5 rounded-xs bg-brand-cyan" />
            <span className="absolute right-1 top-1/2 -translate-y-1/2 rounded-control-lg bg-brand-cyan px-2 py-0.5 text-caption font-extrabold text-brand-ink">Поставить рядом</span>
          </div>
          <div className="flex -rotate-2 items-center gap-2 self-center rounded-control-lg border bg-popover px-3.5 py-2.5 text-label font-bold shadow-overlay">
            <MapPin size={14} className="text-brand-cyan" />Контакты — перетаскиваю
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-l p-4">
        <div className="flex gap-4 border-b pb-3 text-label font-bold">
          <span className="text-muted-foreground">Блок</span>
          <span className="-mb-3 border-b-2 border-primary pb-2.5">Оформление</span>
          <span className="text-muted-foreground">Доступ</span>
        </div>
        <MiniLabel>Шрифт заголовков</MiniLabel>
        <div className="grid grid-cols-2 gap-1.5 text-caption">
          {[['Акцидент', 'var(--font-unbounded)', true], ['Классика', 'var(--font-playfair)', false], ['Мягкий', 'var(--font-comfortaa)', false], ['Плакат', 'var(--font-oswald)', false]].map(([name, family, on]) => (
            <span key={String(name)} className={`flex h-11 items-center gap-2 rounded-control-lg px-2.5 ${on ? 'bg-accent ring-2 ring-primary' : 'bg-muted/60 text-muted-foreground'}`}>
              <b className="text-lead text-foreground" style={{ fontFamily: String(family) }}>Аа</b>{name}
            </span>
          ))}
        </div>
        <MiniLabel>Узор фона</MiniLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {['none', 'stars', 'confetti', 'lines'].map(p => (
            <span key={p} className={`look-pattern-${p} h-10 rounded-control-lg border bg-background ${p === 'stars' ? 'ring-2 ring-primary' : ''}`} />
          ))}
        </div>
        <MiniLabel>Живость</MiniLabel>
        <div className="space-y-2.5 text-label">
          <div className="flex justify-between"><span>Главная мечта крупно</span><Toggle on /></div>
          <div className="flex justify-between"><span>Конфетти при брони</span><Toggle on /></div>
          <div className="flex justify-between"><span>Живой таймер</span><Toggle on={false} /></div>
        </div>
      </div>
    </div>
  )
}
