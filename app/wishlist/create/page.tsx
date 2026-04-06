'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Loader2, LayoutTemplate } from 'lucide-react'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { useApiGetMyTemplates, useApiCreateWishlistFromTemplate } from '@/api/template'
import { templates, WishlistTemplate } from '@/content/templates'
import { Template } from '@/shared/types'
import { TemplateCard } from './components/template-card'
import { TemplateDialog } from './components/template-dialog'
import { FromUserTemplateDialog } from './components/from-user-template-dialog'
import { Button } from '@/components/ui/button'

export default function Page() {
  const router = useRouter()
  const { mutate: createWishlist, isPending: isCreatingSystem } = useApiCreateConstructorWishlist()
  const { mutate: createFromTemplate, isPending: isCreatingFromTemplate } = useApiCreateWishlistFromTemplate()
  const { data: myTemplatesData } = useApiGetMyTemplates()

  const myTemplates = myTemplatesData?.data ?? []
  const isPending = isCreatingSystem || isCreatingFromTemplate

  const [selectedTemplate, setSelectedTemplate] = React.useState<WishlistTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  const [selectedUserTemplate, setSelectedUserTemplate] = React.useState<Template | null>(null)
  const [userDialogOpen, setUserDialogOpen] = React.useState(false)

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
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  const handleUserTemplateClick = (template: Template) => {
    setSelectedUserTemplate(template)
    setUserDialogOpen(true)
  }

  const handleUserTemplateSubmit = (title: string) => {
    if (!selectedUserTemplate) return
    createFromTemplate(
      { templateId: selectedUserTemplate.id, title },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  const handleEmpty = () => {
    createWishlist(
      { title: 'Новый вишлист', blocks: [] },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
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

      {myTemplates.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Мои шаблоны
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/templates')}
              className="text-xs gap-1.5"
            >
              <LayoutTemplate size={14} />
              Пользовательские шаблоны
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {myTemplates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => handleUserTemplateClick(template)}
                disabled={isPending}
                className="rounded-2xl overflow-hidden border border-border hover:border-primary transition-colors text-left"
              >
                <div
                  className="px-4 pt-4 pb-3 text-sm font-semibold"
                  style={{ background: `var(--${template.settings.colorScheme}-background, var(--muted))` }}
                >
                  {template.name}
                </div>
                <div className="px-3.5 py-2 text-xs text-muted-foreground">
                  {template.blocks.length} блоков
                </div>
              </button>
            ))}
          </div>
        </>
      )}

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

      <FromUserTemplateDialog
        template={selectedUserTemplate}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSubmit={handleUserTemplateSubmit}
        isPending={isPending}
      />
    </div>
  )
}
