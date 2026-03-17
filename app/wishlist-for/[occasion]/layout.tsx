import type { Metadata } from 'next'
import { occasions, getOccasionBySlug } from '@/content/occasions'
import { JsonLd } from '@/components/json-ld'

type Props = {
  params: Promise<{ occasion: string }>
  children: React.ReactNode
}

export async function generateStaticParams() {
  return occasions.map((o) => ({ occasion: o.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ occasion: string }> }): Promise<Metadata> {
  const { occasion: slug } = await params
  const occasion = getOccasionBySlug(slug)
  if (!occasion) return {}

  return {
    title: occasion.title,
    description: occasion.metaDescription,
    alternates: { canonical: `https://prosto-namekni.ru/wishlist-for/${occasion.slug}` },
    openGraph: {
      title: occasion.title,
      description: occasion.metaDescription,
      url: `https://prosto-namekni.ru/wishlist-for/${occasion.slug}`,
    },
  }
}

export default async function OccasionLayout({ params, children }: Props) {
  const { occasion: slug } = await params
  const occasion = getOccasionBySlug(slug)
  if (!occasion) return <>{children}</>

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Как создать ${occasion.h1.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Зарегистрируйтесь на Просто намекни, создайте вишлист, добавьте подарки с фото и ссылками, и поделитесь уникальной ссылкой с друзьями.`,
        },
      },
      {
        '@type': 'Question',
        name: 'Это бесплатно?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Да, сервис Просто намекни полностью бесплатный.',
        },
      },
    ],
  }

  return (
    <>
      <JsonLd data={faqSchema} />
      {children}
    </>
  )
}
