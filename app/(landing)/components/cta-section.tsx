'use client'

import Link from 'next/link'
import StarBorder from '@/components/ui/star-border'
import ClickSpark from '@/components/ui/click-spark'
import { useTheme } from 'next-themes'

export function CtaSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'

  return (
    <section
      className="relative py-16 md:py-32 px-4 text-center overflow-hidden"
      style={{
        background: isDark
          ? [
              'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 60%)',
              'linear-gradient(135deg, #000d1a, #0d0030, #001a2e)',
            ].join(', ')
          : [
              'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)',
              'linear-gradient(135deg, #faf8ff, #f0f9ff, #f5f3ff)',
            ].join(', '),
      }}
    >
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
        <span className="text-5xl">🌟</span>

        <h2
          className="text-3xl md:text-4xl font-black tracking-tight"
          style={{ color: isDark ? '#f0f9ff' : '#0f172a' }}
        >
          Готов намекнуть?
        </h2>

        <p style={{ color: isDark ? '#475569' : '#64748b' }} className="text-base">
          Бесплатно. Красиво. Навсегда.
        </p>

        <div className="mt-4">
          <ClickSpark sparkColor="#06b6d4" sparkSize={10} sparkCount={8} duration={400}>
            <StarBorder color="#06b6d4" speed="4s" className="rounded-2xl">
              <Link
                href="/wishlist"
                className="block px-10 py-4 font-extrabold text-white text-lg rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4, #8b5cf6, #10b981)',
                  boxShadow: '0 0 30px rgba(6,182,212,0.3)',
                }}
              >
                ✦ Начать бесплатно
              </Link>
            </StarBorder>
          </ClickSpark>
        </div>
      </div>
    </section>
  )
}
