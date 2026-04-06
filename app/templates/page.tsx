'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LayoutTemplate } from 'lucide-react'
import { useApiGetPublicTemplates, useApiCreateWishlistFromTemplate } from '@/api/template'
import { useApiGetMe } from '@/api/user'
import { Template } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { FromUserTemplateDialog } from '@/app/wishlist/create/components/from-user-template-dialog'
import { TemplatePreviewSheet } from './components/template-preview-sheet'

export default function Page() {
  const router = useRouter()
  const { data: meData } = useApiGetMe()
  const user = meData?.user
  const [cursor, setCursor] = React.useState<string | undefined>(undefined)
  const [allTemplates, setAllTemplates] = React.useState<Template[]>([])

  const { data, isFetching } = useApiGetPublicTemplates(cursor)
  const { mutate: createFromTemplate, isPending: isCreating } = useApiCreateWishlistFromTemplate()

  const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)

  React.useEffect(() => {
    if (data?.data) {
      setAllTemplates((prev) => {
        const ids = new Set(prev.map((t) => t.id))
        return [...prev, ...data.data.filter((t) => !ids.has(t.id))]
      })
    }
  }, [data])

  const openPreview = (template: Template) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
  }

  const handleUse = (template: Template) => {
    if (!user) {
      router.push('/login')
      return
    }
    setPreviewOpen(false)
    setSelectedTemplate(template)
    setDialogOpen(true)
  }

  const handleSubmit = (title: string) => {
    if (!selectedTemplate) return
    createFromTemplate(
      { templateId: selectedTemplate.id, title },
      {
        onSuccess: (res) => {
          if (res.data?.id) router.push(`/wishlist/edit/${res.data.id}`)
        },
      },
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-5">
      <div className="mb-8">
        <LayoutTemplate size={24} className="mb-3 text-muted-foreground" />
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">Пользовательские шаблоны</h1>
        <p className="text-muted-foreground">
          Шаблоны от сообщества — бери готовую структуру и создавай свой вишлист
        </p>
      </div>

      {allTemplates.length === 0 && !isFetching && (
        <div className="text-center py-24 text-muted-foreground">
          Пока нет публичных шаблонов
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {allTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl border border-border overflow-hidden flex flex-col cursor-pointer hover:border-primary transition-colors"
            onClick={() => openPreview(template)}
          >
            <div className="px-4 pt-5 pb-4 bg-muted/40 flex-1">
              <p className="font-semibold text-base mb-1">{template.name}</p>
              <p className="text-xs text-muted-foreground mb-3">
                {template.blocks?.length ?? 0} блоков · {template.settings?.colorScheme ?? ''}
              </p>
              {template.userDisplayName && (
                <p className="text-xs text-muted-foreground">
                  от {template.userDisplayName}
                </p>
              )}
            </div>
            <div className="px-4 py-3 border-t border-border">
              <Button
                size="sm"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleUse(template)
                }}
                disabled={isCreating}
              >
                Использовать
              </Button>
            </div>
          </div>
        ))}
      </div>

      {data?.nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCursor(data.nextCursor!)}
            disabled={isFetching}
          >
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Загрузить ещё'}
          </Button>
        </div>
      )}

      <TemplatePreviewSheet
        template={previewTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUse={handleUse}
        isPending={isCreating}
      />

      <FromUserTemplateDialog
        template={selectedTemplate}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        isPending={isCreating}
      />
    </div>
  )
}
