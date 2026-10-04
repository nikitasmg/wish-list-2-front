import { Lock } from 'lucide-react'
import * as React from 'react'
import { DRESS_PRESETS } from '@/shared/constants'
import { Container, EXAMPLE, ExampleBadge, MiniLabel, MiniTitle, SectionTitle } from './landing-ui'

/** Сцена блока — кусочек страницы в «Полуночи», как у гостей. */
function Stage({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <div className={`demo-scheme wishlist-page look-font-accent relative flex min-h-[156px] flex-col gap-2.5 rounded-card bg-background p-4 text-foreground ${EXAMPLE} ${center ? 'items-center justify-center text-center' : ''}`} aria-hidden>
      <ExampleBadge className="absolute right-2.5 top-2.5 h-5 px-2" />
      {children}
    </div>
  )
}

function Bar({ label, share, active }: { label: string; share: number; active?: boolean }) {
  return (
    <div className={`relative h-8 overflow-hidden rounded-control-lg border text-label ${active ? 'border-primary' : ''}`}>
      <span className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: `${share}%` }} />
      <span className="relative flex justify-between px-2.5 py-1.5"><span>{label}</span><b>{share}%</b></span>
    </div>
  )
}

const BLOCKS: { title: string; text: string; stage: React.ReactNode; desktopOnly?: boolean }[] = [
  {
    title: 'Программа, история, любимое',
    text: 'Один блок «Список» — пять видов: время, таймлайн, пары, теги, плитки.',
    stage: <Stage><MiniLabel>Программа</MiniLabel><MiniTitle>Как пройдёт вечер</MiniTitle>
      <div className="space-y-1.5 text-label">{[['19:00', 'Сбор гостей'], ['19:30', 'Ужин'], ['21:00', 'Торт и тосты']].map(([t, v]) => <div key={t}><b className="text-primary">{t}</b>&nbsp;&nbsp;{v}</div>)}</div></Stage>,
  },
  {
    title: 'Ответ гостя',
    text: '+1, дети, меню, трансфер, свои вопросы, срок ответа и «Кто идёт».',
    stage: <Stage><MiniLabel>Ответ гостя · до 10 октября</MiniLabel><MiniTitle>Придёте?</MiniTitle>
      <div className="flex justify-between text-label"><span>Сколько детей</span><span>− 2 +</span></div>
      <div className="-mx-2 flex justify-between rounded-control-lg bg-primary/10 px-2 py-1 text-label"><span>Какой торт любите?</span><span className="text-primary">свой вопрос</span></div>
      <div className="flex gap-1.5"><span className="flex h-8 flex-1 items-center justify-center rounded-control-lg bg-primary text-caption font-bold text-primary-foreground">Придём</span><span className="flex h-8 flex-1 items-center justify-center rounded-control-lg border text-caption">Не сможем</span></div></Stage>,
  },
  {
    title: 'Голосование',
    text: 'Один или несколько вариантов, результаты после голоса, варианты от гостей.',
    stage: <Stage><MiniLabel>Голосование</MiniLabel><MiniTitle>Какой торт заказать?</MiniTitle><Bar label="Медовик" share={62} active /><Bar label="Шоколадный" share={38} /></Stage>,
  },
  {
    title: 'Секрет до даты',
    text: 'Любой блок прячется до праздника: замок с таймером, только замок или ничего.',
    stage: <Stage center><Lock size={22} className="text-muted-foreground" /><MiniTitle>Секрет откроется на празднике</MiniTitle>
      <div className="flex gap-3.5">{[['15', 'дн'], ['02', 'ч'], ['41', 'мин']].map(([v, l]) => <span key={l}><b className="heading text-lead">{v}</b> <MiniLabel>{l}</MiniLabel></span>)}</div></Stage>,
  },
  {
    title: 'Место и дресс-код',
    text: 'Маршрут до одной или нескольких точек, палитра с названиями цветов.',
    desktopOnly: true,
    stage: <Stage><MiniLabel>Дресс-код</MiniLabel><MiniTitle>Цвета вечера</MiniTitle>
      <div className="flex gap-3 text-center text-micro">{[[DRESS_PRESETS[0], 'Жёлтый'], [DRESS_PRESETS[8], 'Синий'], [DRESS_PRESETS[10], 'Белый']].map(([c, n]) => <div key={n}><span className="mb-1 block h-9 w-9 rounded-full" style={{ background: c }} />{n}</div>)}
        <div><span className="mx-auto mb-1 block h-9 w-[26px] rounded-t-full rounded-b-xs" style={{ background: DRESS_PRESETS[1] }} />Арки</div></div></Stage>,
  },
  {
    title: 'Плейлист и поздравления',
    text: 'Гости предлагают треки и голосуют, оставляют тёплые слова. Вы модерируете.',
    desktopOnly: true,
    stage: <Stage><MiniLabel>Плейлист и поздравления</MiniLabel>
      {[['Кино — Группа крови', 9], ['Daft Punk — One More Time', 7]].map(([t, v]) => <div key={String(t)} className="flex justify-between border-b pb-1.5 text-label"><span>{t}</span><b className="text-primary">▲ {v}</b></div>)}
      <p className="text-label italic text-muted-foreground">«Папа, ты лучший. Спасибо за всё» — Лена</p></Stage>,
  },
]

export function BlocksSection() {
  return (
    <section id="blocks" className="scroll-mt-20 border-y bg-muted/30 py-20 md:border-y-0 md:bg-transparent md:py-28">
      <Container className="space-y-10 md:space-y-10">
        <SectionTitle
          eyebrow="14 блоков"
          title={<>Всё о празднике —<br className="hidden md:block" /> на одной странице</>}
          lead="Одни и те же блоки собирают и шаблоны, и вашу страницу. Любой блок можно спрятать до даты — вместо него гости увидят таймер."
        />
        <div className="grid gap-4 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
          {BLOCKS.map(block => (
            <article key={block.title} className={`flex-col gap-3.5 rounded-sheet border bg-card p-4 md:p-5 ${block.desktopOnly ? 'hidden md:flex' : 'flex'}`}>
              {block.stage}
              <h3 className="text-title-xs font-extrabold">{block.title}</h3>
              <p className="-mt-2 text-body-sm leading-relaxed text-muted-foreground">{block.text}</p>
            </article>
          ))}
        </div>
        <p className="text-body-sm text-muted-foreground md:hidden">А ещё: место с маршрутом, дресс-код, контакты, плейлист, поздравления, фото и видео.</p>
      </Container>
    </section>
  )
}
