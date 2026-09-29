'use client'

import Link from 'next/link'
import AnimatedContent from '@/components/ui/animated-content'
import FadeContent from '@/components/ui/fade-content'
import { useTheme } from 'next-themes'
import {
  Calendar,
  CheckSquare,
  FileText,
  LayoutGrid,
  MapPin,
  Timer,
  User,
} from 'lucide-react'

const MOCK_TEMPLATES = [
  {
    name: 'День рождения',
    author: 'Анна М.',
    blocks: [
      { icon: FileText, label: 'Текст' },
      { icon: Calendar, label: 'Дата' },
      { icon: MapPin, label: 'Место' },
      { icon: Timer, label: 'Таймер' },
    ],
    accent: '#06b6d4',
    bg: 'rgba(6,182,212,0.07)',
    border: 'rgba(6,182,212,0.2)',
    lightBg: 'rgba(6,182,212,0.06)',
    lightBorder: 'rgba(6,182,212,0.25)',
  },
  {
    name: 'Свадьба',
    author: 'Дмитрий К.',
    blocks: [
      { icon: FileText, label: 'Текст' },
      { icon: LayoutGrid, label: 'Галерея' },
      { icon: MapPin, label: 'Место' },
      { icon: User, label: 'Контакт' },
      { icon: CheckSquare, label: 'Чеклист' },
    ],
    accent: '#a855f7',
    bg: 'rgba(168,85,247,0.07)',
    border: 'rgba(168,85,247,0.2)',
    lightBg: 'rgba(168,85,247,0.06)',
    lightBorder: 'rgba(168,85,247,0.25)',
  },
  {
    name: 'Новый год',
    author: 'Мария П.',
    blocks: [
      { icon: FileText, label: 'Текст' },
      { icon: Timer, label: 'Таймер' },
      { icon: CheckSquare, label: 'Чеклист' },
      { icon: LayoutGrid, label: 'Галерея' },
    ],
    accent: '#10b981',
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.2)',
    lightBg: 'rgba(16,185,129,0.06)',
    lightBorder: 'rgba(16,185,129,0.25)',
  },
]

export function TemplatesSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <section
      className="relative py-8 md:py-24 px-4"
      style={{ background: isDark ? '#080014' : '#faf5ff' }}
    >
      <div className="max-w-5xl mx-auto">
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="text-center mb-8 md:mb-12">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: isDark ? '#a855f7' : '#9333ea' }}
            >
              Сообщество
            </p>
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-3"
              style={{ color: isDark ? '#e9d5ff' : '#581c87' }}
            >
              Не начинай с нуля
            </h2>
            <p
              className="text-base max-w-md mx-auto"
              style={{ color: isDark ? '#475569' : '#64748b' }}
            >
              Другие пользователи уже собрали готовые структуры —
              бери любой шаблон и настраивай под себя
            </p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {MOCK_TEMPLATES.map((t, i) => (
            <FadeContent key={t.name} duration={600} delay={i * 120}>
              <div
                className="rounded-2xl p-5 flex flex-col gap-3 h-full"
                style={{
                  background: isDark ? t.bg : t.lightBg,
                  border: `1px solid ${isDark ? t.border : t.lightBorder}`,
                }}
              >
                <div>
                  <p
                    className="font-bold text-base"
                    style={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  >
                    {t.name}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: isDark ? '#475569' : '#94a3b8' }}
                  >
                    от {t.author}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {t.blocks.map((b) => (
                    <span
                      key={b.label}
                      className="flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                        color: t.accent,
                        border: `1px solid ${t.accent}30`,
                      }}
                    >
                      <b.icon size={9} />
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </FadeContent>
          ))}
        </div>

        <AnimatedContent direction="vertical" reverse={false} delay={200}>
          <div className="text-center">
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-white transition-opacity hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                boxShadow: isDark ? '0 0 24px rgba(168,85,247,0.3)' : '0 4px 16px rgba(168,85,247,0.25)',
              }}
            >
              Смотреть шаблоны сообщества
            </Link>
          </div>
        </AnimatedContent>
      </div>
    </section>
  )
}
