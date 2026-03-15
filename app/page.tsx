import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/app/(landing)/components/hero-section'
import { MarqueeSection } from '@/app/(landing)/components/marquee-section'
import { StorySection } from '@/app/(landing)/components/story-section'
import { ConstructorSection } from '@/app/(landing)/components/constructor-section'
import { ThemesSection } from '@/app/(landing)/components/themes-section'
import { FeaturesSection } from '@/app/(landing)/components/features-section'
import { CtaSection } from '@/app/(landing)/components/cta-section'

export const metadata: Metadata = {
  title: 'GetMyWishlist — Создавайте красивые вишлисты бесплатно',
  description: 'Собери всё что хочешь в красивый список и просто отправь ссылку. Никаких неловких разговоров о подарках.',
}

export default function Home() {
  return (
    <div className="min-h-screen font-manrope">
      <Header />
      <main>
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
