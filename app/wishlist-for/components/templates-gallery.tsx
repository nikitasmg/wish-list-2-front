'use client'

import { useApiGetSystemTemplates } from '@/api/system-template'
import { TemplatePreview } from '@/app/wishlist/create/components/template-preview'
import { cn } from '@/lib/utils'
import { colorSchema, normalizeScheme } from '@/shared/constants'
import { pluralRu } from '@/shared/event-date'
import { withName } from '@/shared/template-name'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

/**
 * Публичная витрина системных шаблонов — вместо старых примеров вишлистов.
 * Карточка ведёт на экран создания с уже выбранным шаблоном.
 */
export function TemplatesGallery() {
  const { data, isLoading } = useApiGetSystemTemplates()
  const [category, setCategory] = React.useState('all')

  const templates = data?.data.templates ?? []
  const categories = data?.data.categories ?? []
  const shown = category === 'all' ? templates : templates.filter(t => t.category === category)

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" /></div>
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-card border border-dashed p-8 text-center text-muted-foreground">
        Шаблоны сейчас недоступны — <Link href="/wishlist/create" className="text-primary hover:underline">соберите страницу с нуля</Link>.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {[{ id: 'all', name: `Все · ${templates.length}` }, ...categories].map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={cn(
              'h-9 rounded-full border px-4 text-body-sm font-semibold transition-colors',
              category === c.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map(template => {
          const scheme = colorSchema.find(s => s.value === normalizeScheme(template.colorScheme)) ?? colorSchema[0]
          return (
            <Link
              key={template.id}
              href={`/wishlist/create?template=${encodeURIComponent(template.id)}`}
              className="group flex flex-col gap-2"
            >
              <TemplatePreview
                template={withName(template)}
                className="h-[230px] ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-primary"
              />
              <span className="px-0.5">
                <span className="block text-body-sm font-bold leading-snug group-hover:text-primary">{template.name}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: scheme.colors[1] }} aria-hidden />
                  {scheme.name} · {template.blocks.length} {pluralRu(template.blocks.length, ['блок', 'блока', 'блоков'])}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
