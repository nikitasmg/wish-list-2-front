'use client'

import AnimatedContent from '@/components/ui/animated-content'
import { useTheme } from 'next-themes'

export function StorySection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <section
      className="relative py-12 md:py-24 px-4"
      style={{
        background: isDark
          ? 'linear-gradient(180deg, #000d1a 0%, #05111f 50%, #0a0020 100%)'
          : 'linear-gradient(180deg, #f8faff 0%, #f5f3ff 50%, #faf8ff 100%)',
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-0">

        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="flex gap-5 items-start">
            <span className="text-4xl flex-shrink-0 mt-1">😩</span>
            <div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}
              >
                &quot;Что тебе подарить?&quot;
              </h3>
              <p style={{ color: isDark ? '#64748b' : '#64748b' }} className="leading-relaxed">
                Этот вопрос каждый раз ставит в тупик. Отвечаешь &quot;всё нормально&quot; — получаешь что попало.
              </p>
            </div>
          </div>
        </AnimatedContent>

        <div
          className="w-px h-16 ml-[22px] mt-2 mb-2"
          style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.5), transparent)' }}
        />

        <AnimatedContent direction="vertical" reverse={false} delay={0.15}>
          <div className="flex gap-5 items-start">
            <span className="text-4xl flex-shrink-0 mt-1">✨</span>
            <div>
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: isDark ? '#a5f3fc' : '#0891b2' }}
              >
                Просто намекни — и всё
              </h3>
              <p style={{ color: isDark ? '#94a3b8' : '#64748b' }} className="leading-relaxed">
                Собери желания в красивый список и отправь ссылку.{' '}
                Друзья сами выбирают что подарить.
              </p>
            </div>
          </div>
        </AnimatedContent>

      </div>
    </section>
  )
}
