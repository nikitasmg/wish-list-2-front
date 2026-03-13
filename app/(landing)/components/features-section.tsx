'use client'

import FadeContent from '@/components/ui/fade-content'
import AnimatedContent from '@/components/ui/animated-content'

const FEATURES = [
  {
    icon: '🎨',
    title: '10 тем оформления',
    desc: 'Для каждого случая',
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.18)',
    text: '#a5f3fc',
  },
  {
    icon: '🔗',
    title: 'Короткая ссылка',
    desc: 'Один клик — и готово',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.18)',
    text: '#c4b5fd',
  },
  {
    icon: '✅',
    title: 'Отметки "куплено"',
    desc: 'Друзья не задвоят',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    text: '#6ee7b7',
  },
  {
    icon: '⚡',
    title: '2 минуты',
    desc: 'До готового вишлиста',
    bg: 'rgba(217,70,239,0.07)',
    border: 'rgba(217,70,239,0.18)',
    text: '#f5d0fe',
  },
]

export function FeaturesSection() {
  return (
    <section
      className="relative py-24 px-4"
      style={{ background: '#040f0a' }}
    >
      <div className="max-w-3xl mx-auto">
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <h2
            className="text-3xl md:text-4xl font-black tracking-tight text-center mb-12"
            style={{ color: '#6ee7b7' }}
          >
            Всё что нужно
          </h2>
        </AnimatedContent>

        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <FadeContent key={f.title} duration={600} delay={i * 100}>
              <div
                className="rounded-2xl p-5"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold mt-2" style={{ color: f.text }}>
                  {f.title}
                </p>
                <p className="text-xs mt-1 text-[#334155]">{f.desc}</p>
              </div>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  )
}
