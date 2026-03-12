'use client'

import Link from 'next/link'
import Particles from '@/components/ui/particles'
import SplashCursor from '@/components/ui/splash-cursor'
import BlurText from '@/components/ui/blur-text'

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Aurora background */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.2) 0%, transparent 50%)',
            'radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.3) 0%, transparent 50%)',
            'radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.12) 0%, transparent 40%)',
            '#000d1a',
          ].join(', '),
        }}
      />

      {/* Particles — behind content */}
      <Particles
        className="absolute inset-0 z-0"
        particleCount={80}
        particleColors={['#a5f3fc', '#c4b5fd']}
        particleBaseSize={60}
      />

      {/* Splash cursor — global fixed overlay */}
      <SplashCursor />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center px-4 py-1.5 rounded-full text-xs tracking-widest font-medium"
          style={{
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.35)',
            color: '#c4b5fd',
          }}
        >
          ✦ бесплатно · красиво · навсегда
        </div>

        {/* Headline — BlurText does not accept style prop, gradient applied on wrapper span */}
        <div className="flex flex-col items-center gap-1">
          <BlurText
            text="Твои мечты заслуживают"
            className="text-5xl md:text-6xl font-black leading-tight tracking-tight text-[#f0f9ff]"
            delay={100}
            animateBy="words"
          />
          <span className="bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent">
            <BlurText
              text="красивого списка."
              className="text-5xl md:text-6xl font-black leading-tight tracking-tight"
              delay={300}
              animateBy="words"
            />
          </span>
        </div>

        {/* Subtext */}
        <p className="text-base md:text-lg text-[#94a3b8] max-w-md leading-relaxed">
          Собери всё что хочешь — и просто отправь ссылку.{' '}
          <span className="text-[#64748b]">Никаких неловких разговоров о подарках.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/wishlist"
            className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-transform hover:scale-[1.03]"
            style={{
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              boxShadow: '0 0 24px rgba(6,182,212,0.35)',
            }}
          >
            Создать вишлист ✦
          </Link>
          <Link
            href="/s/example"
            className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:text-[#c4b5fd]"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#94a3b8',
            }}
          >
            Смотреть пример
          </Link>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #000d1a)' }}
      />
    </section>
  )
}
