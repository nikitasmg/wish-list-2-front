import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { JsonLd } from '@/components/json-ld'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { getAllPosts, getPostBySlug } from '@/lib/blog'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `https://prosto-namekni.ru/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `https://prosto-namekni.ru/blog/${post.slug}`,
      publishedTime: post.date,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  let MDXContent: React.ComponentType
  try {
    const mod = await import(`@/content/blog/${slug}.mdx`)
    MDXContent = mod.default
  } catch {
    notFound()
  }

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      '@type': 'Organization',
      name: 'Просто намекни',
      url: 'https://prosto-namekni.ru',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Просто намекни',
      url: 'https://prosto-namekni.ru',
    },
    url: `https://prosto-namekni.ru/blog/${post.slug}`,
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://prosto-namekni.ru' },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: 'https://prosto-namekni.ru/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://prosto-namekni.ru/blog/${post.slug}` },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={breadcrumbSchema} />
      <Header />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <Breadcrumbs
            items={[{ name: 'Блог', url: '/blog' }]}
            page={post.title}
          />

          <article className="prose prose-neutral dark:prose-invert max-w-none mt-8">
            <MDXContent />
          </article>

          <div className="mt-12 pt-8 border-t border-border">
            <Link href="/blog" className="text-primary hover:underline">
              &larr; Все статьи
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
