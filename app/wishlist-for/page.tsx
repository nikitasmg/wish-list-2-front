import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { occasions } from '@/content/occasions'
import { colorSchema } from '@/shared/constants'
import { Breadcrumbs } from '@/components/breadcrumbs'

export const metadata: Metadata = {
  title: 'Примеры вишлистов для разных поводов',
  description: 'Посмотри примеры вишлистов на день рождения, свадьбу, Новый год и другие праздники. Вдохновись и создай свой.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/wishlist-for',
  },
}

function OccasionCover({ colorScheme }: { colorScheme: string }) {
  const scheme = colorSchema.find((s) => s.value === colorScheme) ?? colorSchema[0]
  const bg = scheme.colors[0] ?? '#ffffff'
  const accent = scheme.colors[1] ?? '#000000'
  return (
    <div
      className="w-full h-[140px] rounded-t-xl"
      style={{
        backgroundImage: [
          `radial-gradient(circle, ${accent}26 1px, transparent 1px)`,
          `linear-gradient(135deg, ${accent}40 0%, ${bg}26 100%)`,
        ].join(', '),
        backgroundSize: '18px 18px, 100% 100%',
        backgroundColor: bg,
      }}
    />
  )
}

export default function WishlistForPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Примеры вишлистов для разных поводов',
        description: 'Коллекция примеров вишлистов на разные праздники',
        url: 'https://prosto-namekni.ru/wishlist-for',
      }} />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <Breadcrumbs items={[]} page="Примеры вишлистов" />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Примеры вишлистов</h1>
            <p className="text-lg text-muted-foreground">
              Посмотри, как выглядят вишлисты для разных поводов — и создай свой
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {occasions.map((occasion) => (
              <Link
                key={occasion.slug}
                href={`/wishlist-for/${occasion.slug}`}
                className="group border rounded-xl shadow hover:shadow-md transition-shadow bg-card flex flex-col"
              >
                <OccasionCover colorScheme={occasion.wishlist.settings.colorScheme} />
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <h2 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors">
                    {occasion.h1}
                  </h2>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {occasion.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {occasion.presents.length} подарков в примере
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
