import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { getAllPosts } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Блог о вишлистах',
  description: 'Советы по созданию вишлистов, идеи подарков и гиды для разных праздников.',
  alternates: {
    canonical: 'https://prosto-namekni.ru/blog',
  },
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div className="min-h-screen bg-background text-foreground font-manrope">
      <Header />
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
            Блог
          </h1>
          <p className="text-muted-foreground text-lg mb-12">
            Советы по вишлистам, идеи подарков и руководства для всех поводов.
          </p>

          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="border-b border-border pb-8">
                <Link href={`/blog/${post.slug}`} className="group">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mb-3">{post.description}</p>
                  <span className="text-sm text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
