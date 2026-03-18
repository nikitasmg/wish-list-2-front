'use client'

import FadeContent from '@/components/ui/fade-content'
import AnimatedContent from '@/components/ui/animated-content'
import { useTheme } from 'next-themes'

const FEATURES = [
  {
    icon: '🎨',
    title: '10 тем оформления',
    desc: 'Для каждого случая',
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.18)',
    lightBg: 'rgba(6,182,212,0.08)',
    lightBorder: 'rgba(6,182,212,0.3)',
    text: '#a5f3fc',
    lightText: '#0891b2',
  },
  {
    icon: '🔗',
    title: 'Короткая ссылка',
    desc: 'Один клик — и готово',
    bg: 'rgba(139,92,246,0.07)',
    border: 'rgba(139,92,246,0.18)',
    lightBg: 'rgba(139,92,246,0.08)',
    lightBorder: 'rgba(139,92,246,0.3)',
    text: '#c4b5fd',
    lightText: '#7c3aed',
  },
  {
    icon: '✅',
    title: 'Отметки "куплено"',
    desc: 'Друзья не задвоят',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    lightBg: 'rgba(16,185,129,0.08)',
    lightBorder: 'rgba(16,185,129,0.3)',
    text: '#6ee7b7',
    lightText: '#059669',
  },
  {
    icon: '⚡',
    title: '2 минуты',
    desc: 'До готового вишлиста',
    bg: 'rgba(217,70,239,0.07)',
    border: 'rgba(217,70,239,0.18)',
    lightBg: 'rgba(217,70,239,0.08)',
    lightBorder: 'rgba(217,70,239,0.3)',
    text: '#f5d0fe',
    lightText: '#a21caf',
  },
]

export function FeaturesSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <section
      className="relative py-24 px-4"
      style={{ background: isDark ? '#040f0a' : '#f0fdf4' }}
    >
      <div className="max-w-3xl mx-auto">
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <h2
            className="text-3xl md:text-4xl font-black tracking-tight text-center mb-12"
            style={{ color: isDark ? '#6ee7b7' : '#059669' }}
          >
            Всё что нужно
          </h2>
        </AnimatedContent>

        <div className="grid grid-cols-2 gap-4">
          {FEATURES.map((f, i) => (
            <FadeContent key={f.title} duration={600} delay={i * 100}>
              <div
                className="rounded-2xl p-5"
                style={{
                  background: isDark ? f.bg : f.lightBg,
                  border: `1px solid ${isDark ? f.border : f.lightBorder}`,
                }}
              >
                <span className="text-2xl">{f.icon}</span>
                <p
                  className="text-sm font-bold mt-2"
                  style={{ color: isDark ? f.text : f.lightText }}
                >
                  {f.title}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: isDark ? '#334155' : '#64748b' }}
                >
                  {f.desc}
                </p>
              </div>
            </FadeContent>
          ))}
        </div>
      </div>
    </section>
  )
}
