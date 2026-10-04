import type { Metadata } from 'next'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { TemplatesGallery } from '@/app/wishlist-for/components/templates-gallery'

export const metadata: Metadata = {
  title: 'Шаблоны вишлистов для разных поводов',
  description: 'Готовые страницы праздника на день рождения, свадьбу, юбилей и другие поводы: программа, место, ответ гостя и вишлист. Выбери шаблон и собери свою.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/wishlist-for',
  },
}

/**
 * Раньше здесь были примеры вишлистов (content/occasions). Пока они не
 * переделаны под новые страницы, вместо них — системные шаблоны.
 * Страницы /wishlist-for/[occasion] остаются, но сюда больше не ссылаются.
 */
export default function WishlistForPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Шаблоны вишлистов для разных поводов',
        description: 'Готовые шаблоны страниц праздника с вишлистом',
        url: 'https://prosto-namekni.ru/wishlist-for',
      }} />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <Breadcrumbs items={[]} page="Шаблоны" />
          <div className="space-y-2">
            <h1 className="text-title-lg font-bold text-primary">Шаблоны</h1>
            <p className="text-lead text-muted-foreground">
              Готовая страница под повод: блоки, тексты-подсказки и цветовая схема. Выберите — и поправьте под себя
            </p>
          </div>
          <TemplatesGallery />
        </div>
      </main>
      <Footer />
    </div>
  )
}
