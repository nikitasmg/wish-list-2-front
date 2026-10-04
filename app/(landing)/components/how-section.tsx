import * as React from 'react'
import { Container, SectionTitle } from './landing-ui'

const OCCASIONS = ['День рождения', 'Свадьба', 'Юбилей', 'Гендер-пати', 'Новоселье', 'Просто хочу']

/** Лента поводов: сразу видно, что сервис не только про дни рождения. */
export function OccasionsStrip() {
  return (
    <section className="border-y py-6 md:py-8">
      <Container className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm font-bold text-muted-foreground md:justify-between md:text-title-xs">
        <span className="hidden text-body-sm font-semibold md:inline">Для любого повода</span>
        {OCCASIONS.map((name, i) => (
          <React.Fragment key={name}>
            {i > 0 && <span className="hidden text-border md:inline" aria-hidden>✦</span>}
            <span className="text-foreground/50">{name}</span>
          </React.Fragment>
        ))}
      </Container>
    </section>
  )
}

const STEPS = [
  { title: 'Выберите шаблон', text: 'Восемь готовых страниц под повод — с блоками, текстами-подсказками и цветовой схемой. Замените пару строк — и готово.', tone: 'bg-tone-cyan/15 text-tone-cyan' },
  { title: 'Соберите под себя', text: 'Добавляйте блоки «+» между блоками, ставьте их рядом в ряд, меняйте шрифт и узор фона. Всё сохраняется само.', tone: 'bg-tone-violet/15 text-tone-violet' },
  { title: 'Отправьте ссылку', text: 'Гости бронируют подарки и отвечают на приглашение без регистрации. Вы видите ответы, но не знаете, кто что дарит.', tone: 'bg-tone-pink/15 text-tone-pink' },
]

export function HowSection() {
  return (
    <section id="how" className="scroll-mt-20 py-20 md:py-28">
      <Container className="space-y-10 md:space-y-14">
        <SectionTitle
          eyebrow="Как это работает"
          title="Три шага до готовой страницы"
          lead="Никаких неловких разговоров о подарках: всё нужное гости увидят по одной ссылке."
        />
        <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex flex-col gap-4 rounded-sheet border bg-card p-6 md:p-8">
              <span className={`flex h-11 w-11 items-center justify-center rounded-card font-unbounded text-title-xs font-extrabold ${step.tone}`}>{i + 1}</span>
              <h3 className="font-unbounded text-title font-bold">{step.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
