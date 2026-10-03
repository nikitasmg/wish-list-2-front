import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { HeroSection } from '@/app/(landing)/components/hero-section'
import { HowSection, OccasionsStrip } from '@/app/(landing)/components/how-section'
import { ConstructorSection } from '@/app/(landing)/components/constructor-section'
import { BlocksSection } from '@/app/(landing)/components/blocks-section'
import { GiftsShowcase } from '@/app/(landing)/components/gifts-showcase'
import { ThemesSection } from '@/app/(landing)/components/themes-section'
import { TemplatesSection } from '@/app/(landing)/components/templates-section'
import { CtaSection, PhoneSection } from '@/app/(landing)/components/cta-section'

export const metadata: Metadata = {
  title: 'Просто намекни — Создай вишлист и отправь ссылку',
  description: 'Намекни на то, чего хочешь — создай красивый вишлист онлайн и отправь ссылку. Никаких неловких разговоров о подарках. Бесплатно.',
  openGraph: {
    title: 'Просто намекни — Создай вишлист онлайн',
    description: 'Создай вишлист за минуту и поделись с друзьями. Бесплатно.',
    url: 'https://prosto-namekni.ru',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://prosto-namekni.ru',
  },
}

export default function Home() {
  return (
    <div className="min-h-screen font-manrope">
      <Header />
      <main>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Просто намекни',
          url: 'https://prosto-namekni.ru',
        }} />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Просто намекни',
          url: 'https://prosto-namekni.ru',
          applicationCategory: 'LifestyleApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
          description: 'Бесплатный сервис создания вишлистов онлайн',
        }} />
        <HeroSection />
        <OccasionsStrip />
        <HowSection />
        <ConstructorSection />
        <BlocksSection />
        <GiftsShowcase />
        <ThemesSection />
        <TemplatesSection />
        <PhoneSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
