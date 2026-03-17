import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { HeroSection } from '@/app/(landing)/components/hero-section'
import { MarqueeSection } from '@/app/(landing)/components/marquee-section'
import { StorySection } from '@/app/(landing)/components/story-section'
import { ConstructorSection } from '@/app/(landing)/components/constructor-section'
import { ThemesSection } from '@/app/(landing)/components/themes-section'
import { FeaturesSection } from '@/app/(landing)/components/features-section'
import { CtaSection } from '@/app/(landing)/components/cta-section'

export const metadata: Metadata = {
  title: 'Просто намекни — Создай вишлист и отправь ссылку',
  description: 'Намекни на то, чего хочешь — создай красивый вишлист онлайн и отправь ссылку. Никаких неловких разговоров о подарках. Бесплатно.',
  openGraph: {
    title: 'Просто намекни — Создай вишлист онлайн',
    description: 'Создай вишлист за минуту и поделись с друзьями. Бесплатно.',
    url: 'https://prosto-namekni.ru',
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
        <MarqueeSection />
        <StorySection />
        <ConstructorSection />
        <ThemesSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
