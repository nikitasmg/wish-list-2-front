'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { templates, WishlistTemplate } from '@/content/templates'
import { TemplateCard } from './components/template-card'
import { TemplateDialog } from './components/template-dialog'

export default function Page() {
  const router = useRouter()
  const { mutate: createWishlist, isPending } = useApiCreateConstructorWishlist()

  const [selectedTemplate, setSelectedTemplate] = React.useState<WishlistTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const handleTemplateClick = (template: WishlistTemplate) => {
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleTemplateSubmit = (template: WishlistTemplate, title: string, date?: Date) => {
    createWishlist(
      {
        title,
        colorScheme: template.colorScheme,
        blocks: template.buildBlocks(title, date),
      },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            router.push(`/wishlist/edit/${res.data.id}`)
          }
        },
      },
    )
  }

  const handleEmpty = () => {
    createWishlist(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            router.push(`/wishlist/edit/${res.data.id}`)
          }
        },
      },
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ChevronLeft size={16} />
        Назад
      </button>

      <h2 className="text-4xl mb-2">Создать вишлист</h2>
      <p className="text-muted-foreground mb-8">
        Начни с шаблона — мы уже собрали структуру за тебя.
      </p>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
        Выбери шаблон
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        {templates.map((template) => (
          <TemplateCard key={template.id} template={template} onClick={handleTemplateClick} />
        ))}
        <div className="rounded-2xl overflow-hidden opacity-60 cursor-default flex flex-col h-full">
          <div className="bg-gradient-to-br from-muted to-muted/60 px-4 pt-5 pb-3.5 text-center">
            <div className="text-4xl mb-1 opacity-40">✨</div>
            <div className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
              Скоро
            </div>
          </div>
          <div className="bg-muted/30 px-3.5 py-3 border-t-2 border-muted flex-1">
            <div className="font-bold text-sm mb-0.5 text-muted-foreground">Больше шаблонов</div>
            <div className="text-xs text-muted-foreground/60">Новый год, юбилей…</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">или</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        onClick={handleEmpty}
        disabled={isPending}
        className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="animate-spin text-muted-foreground" size={24} />
        ) : (
          <span className="text-2xl">📋</span>
        )}
        <div>
          <div className="font-semibold text-sm">Пустой вишлист</div>
          <div className="text-xs text-muted-foreground">Начни с чистого листа, добавь блоки сам</div>
        </div>
      </button>

      <TemplateDialog
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleTemplateSubmit}
        isPending={isPending}
      />
    </div>
  )
}
