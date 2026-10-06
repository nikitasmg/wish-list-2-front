import { Button } from '@/components/ui/button'
import { santaHref } from '@/shared/santa-route'
import { Gift } from 'lucide-react'
import Link from 'next/link'

const STEPS = [
  { n: '01', tone: 'text-tone-pink', title: 'Создайте комнату', text: 'Название, бюджет и дата обмена — пара минут.' },
  { n: '02', tone: 'text-tone-gold', title: 'Позовите своих', text: 'Отправьте ссылку. Каждый пишет имя и что хотел бы получить.' },
  { n: '03', tone: 'text-success', title: 'Жеребьёвка', text: 'Все встают в один круг: каждый дарит одному и получает от другого. Себя не вытянуть.' },
  { n: '04', tone: 'text-tone-cyan', title: 'Узнайте подопечного', text: 'Откройте конверт: имя, пожелания и вишлист того, кому вы дарите.' },
] as const

export default function SantaLanding() {
  return (
    <div className="space-y-20">
      <section className="santa-snow -mx-4 space-y-7 px-4 py-16 md:-mx-16 md:px-16 md:py-24">
        <p className="text-eyebrow uppercase text-tone-gold">Новый год · офис · семья · друзья</p>
        <h1 className="text-display-sm md:text-display">
          Тайный Санта
          <br />
          <span className="text-primary">без бумажек в шапке</span>
        </h1>
        <p className="max-w-xl text-body-lg text-muted-foreground">
          Соберите своих в комнату. Каждый напишет, что хочет получить, а мы тайно распределим,
          кто кому дарит.
        </p>
        <Button asChild variant="festive" size="xl">
          <Link href={santaHref('/rooms/new')}>
            <Gift aria-hidden />
            Создать комнату
          </Link>
        </Button>
      </section>

      <section className="space-y-8" aria-labelledby="how">
        <h2 id="how" className="text-title-lg md:text-display-md">Четыре шага до праздника</h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(step => (
            <li key={step.n} className="space-y-3 rounded-card border border-border bg-card p-7">
              <span className={`block text-display-sm ${step.tone}`}>{step.n}</span>
              <h3 className="text-title-sm">{step.title}</h3>
              <p className="text-body text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
