'use client'

import Link from 'next/link'
import StarBorder from '@/components/ui/star-border'
import ClickSpark from '@/components/ui/click-spark'

export function CtaSection() {
  return (
    <section
      className="relative py-32 px-4 text-center overflow-hidden"
      style={{
        background: [
          'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 60%)',
          'linear-gradient(135deg, #000d1a, #0d0030, #001a2e)',
        ].join(', '),
      }}
    >
      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4">
        <span className="text-5xl">🌟</span>

        <h2
          className="text-3xl md:text-4xl font-black tracking-tight"
          style={{ color: '#f0f9ff' }}
        >
          Готов намекнуть?
        </h2>

        <p className="text-[#475569] text-base">
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
