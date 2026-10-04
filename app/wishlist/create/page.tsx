'use client'

import { useApiGetMyTemplates, useApiCreateWishlistFromTemplate } from '@/api/template'
import { useApiCreateFromSystemTemplate, useApiGetSystemTemplates } from '@/api/system-template'
import { useApiCreateConstructorWishlist } from '@/api/wishlist'
import { CreateQuiz } from '@/app/wishlist/create/components/create-quiz'
import { FromUserTemplateDialog } from '@/app/wishlist/create/components/from-user-template-dialog'
import { TemplatePhonePreview, TemplatePreview, blockLabel } from '@/app/wishlist/create/components/template-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { USER_TEMPLATES_ENABLED, colorSchema, normalizeScheme } from '@/shared/constants'
import { localNoon, pluralRu } from '@/shared/event-date'
import { Template } from '@/shared/types'
import { usesName, withName } from '@/shared/template-name'
import { LayoutTemplate, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'

/**
 * Экран создания вишлиста.
 *
 * Здесь и только здесь живут системные заготовки — они идут вместе с релизом
 * и одинаковы для всех. Шаблоны, которые люди сохраняют из своих вишлистов и
 * публикуют, — это другая сущность, её витрина лежит на /templates
 * (пока скрыта флагом USER_TEMPLATES_ENABLED).
 */
export default function CreateWishlistPage() {
  const { data, isLoading } = useApiGetSystemTemplates()
  const { mutate: createFromTemplate, isPending } = useApiCreateFromSystemTemplate()
  const { mutate: createBlank, isPending: blankPending } = useApiCreateConstructorWishlist()
  const { mutate: createFromUserTemplate, isPending: userPending } = useApiCreateWishlistFromTemplate()
  const { data: myTemplatesData } = useApiGetMyTemplates(USER_TEMPLATES_ENABLED)
  const router = useRouter()
  const { toast } = useToast()

  // Экран за middleware, но токен мог протухнуть. Вместо невнятной ошибки
  // отправляем на вход: человек уже выбрал шаблон и хочет продолжить.
  const handleFailure = (status?: number) => {
    if (status === 401) {
      router.push('/login')
      return
    }
    toast({ title: 'Не получилось создать вишлист', variant: 'destructive' })
  }

  const templates = useMemo(() => data?.data.templates ?? [], [data])
  const categories = useMemo(() => data?.data.categories ?? [], [data])
  const myTemplates = myTemplatesData?.data ?? []

  const [category, setCategory] = useState('all')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [name, setName] = useState('')
  const [userTemplate, setUserTemplate] = useState<Template | null>(null)
  const [urlTemplate, setUrlTemplate] = useState<string | null>(null)

  // Выбранным считается первый подходящий, пока человек не ткнул сам: пустая
  // правая колонка при заполненной сетке выглядит как поломка.
  // Пришли с публичной витрины шаблонов — сразу показываем выбранный.
  // Читаем из location, а не useSearchParams: тому нужен Suspense вокруг страницы.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('template')
    if (id) { setPickedId(id); setUrlTemplate(id) }
  }, [])

  const shown = category === 'all' ? templates : templates.filter(t => t.category === category)
  const selected = templates.find(t => t.id === pickedId) ?? shown[0] ?? null

  const openEditor = (id: string) => router.push(`/wishlist/edit/${id}`)

  const handleCreate = () => {
    if (!selected) return
    createFromTemplate(
      {
        template_id: selected.id,
        title: title.trim() || undefined,
        name: usesName(selected) ? name.trim() || undefined : undefined,
        // Поле даёт «ГГГГ-ММ-ДД», а такую строку Date разбирает как полночь
        // UTC: у гостей западнее Гринвича праздник уезжал на день назад.
        // Собираем дату по частям — она получается местной.
        event_date: localNoon(eventDate),
      },
      {
        onSuccess: res => openEditor(res.data.id),
        onError: error => handleFailure(error.response?.status),
      },
    )
  }

  const handleBlank = () => {
    createBlank({ title: 'Новый вишлист', blocks: [] }, {
      onSuccess: res => openEditor(res.data.id),
      onError: error => handleFailure(error.response?.status),
    })
  }

  const handleUserTemplate = (name: string) => {
    if (!userTemplate) return
    createFromUserTemplate({ templateId: userTemplate.id, title: name }, {
      onSuccess: res => openEditor(res.data.id),
      onError: error => handleFailure(error.response?.status),
    })
  }

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 className="animate-spin" /></div>
  }

  return (
    <>
      {/* На телефоне — опросник по шагу на экран; сетка с формой сбоку там
          превращалась в длинную ленту. Без шаблонов опроснику нечего
          предложить, и тогда остаётся обычный экран. */}
      {templates.length > 0 && (
        <div className="lg:hidden">
          <CreateQuiz
            key={urlTemplate ?? 'none'}
            templates={templates}
            categories={categories}
            initialTemplateId={urlTemplate}
            onCreated={openEditor}
            onFailure={handleFailure}
          />
        </div>
      )}
      <div className={cn('space-y-10', templates.length > 0 && 'hidden lg:block')}>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-6 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-title-lg font-extrabold">Создать вишлист</h1>
                <p className="mt-2 text-body-sm text-muted-foreground max-w-lg">
                  Готовая страница под повод: блоки, тексты-подсказки и цветовая схема
                </p>
              </div>
              <button
                type="button"
                onClick={handleBlank}
                disabled={blankPending}
                className="hidden text-body-sm font-semibold text-primary hover:underline whitespace-nowrap disabled:opacity-60 lg:inline"
              >
                Собрать с нуля →
              </button>
              {/* Конструктор на телефоне не открывается — с нуля собирают на компьютере. */}
              <span className="text-caption text-muted-foreground lg:hidden">Собрать с нуля — на компьютере</span>
            </div>

            {templates.length === 0 ? (
              <div className="rounded-card border border-dashed p-8 text-center space-y-3">
                <p className="text-muted-foreground">Заготовки сейчас недоступны — можно начать с чистого листа.</p>
                <Button onClick={handleBlank} disabled={blankPending} loading={blankPending}>
                  Пустой вишлист
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <CategoryChip
                    label={`Все · ${templates.length}`}
                    active={category === 'all'}
                    onClick={() => { setCategory('all'); setPickedId(null) }}
                  />
                  {categories.map(c => (
                    <CategoryChip
                      key={c.id}
                      label={c.name}
                      active={category === c.id}
                      onClick={() => { setCategory(c.id); setPickedId(null) }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {shown.map(template => {
                    const scheme = colorSchema.find(s => s.value === normalizeScheme(template.colorScheme)) ?? colorSchema[0]
                    const active = selected?.id === template.id
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setPickedId(template.id)}
                        aria-pressed={active}
                        className="flex flex-col gap-2 text-left focus-visible:outline-none group"
                      >
                        <TemplatePreview
                          template={withName(template)}
                          className={cn(
                            'h-[230px] ring-1 transition-shadow',
                            active ? 'ring-2 ring-primary' : 'ring-border group-hover:ring-primary/40',
                          )}
                        />
                        <span className="px-0.5">
                          <span className="block text-body-sm font-bold leading-snug">{template.name}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: scheme.colors[1] }} aria-hidden />
                            {scheme.name} · {template.blocks.length} {pluralRu(template.blocks.length, ['блок', 'блока', 'блоков'])}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </section>

          {selected && (
            <aside className="rounded-card border bg-card p-5 space-y-5 lg:sticky lg:top-4">
              <div className="flex gap-4">
                <TemplatePhonePreview template={withName(selected, name)} />
                <div className="min-w-0 space-y-2">
                  <h2 className="text-title-xs font-extrabold">{selected.name}</h2>
                  <p className="text-caption text-muted-foreground">
                    {selected.blocks.length} {pluralRu(selected.blocks.length, ['блок', 'блока', 'блоков'])}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {selected.blocks.map(b => (
                      <span
                        key={b.id || `${b.row}-${b.col}`}
                        className="rounded-full border px-2 py-0.5 text-micro text-muted-foreground"
                      >
                        {b.caption || blockLabel(b.type)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-control-lg border p-3 text-body-sm">
                <div className="font-semibold">Схема «{(colorSchema.find(s => s.value === normalizeScheme(selected.colorScheme)) ?? colorSchema[0]).name}»</div>
                <div className="text-caption text-muted-foreground">Можно сменить после создания</div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-3">
                <label className="space-y-1 text-body-sm">
                  <span className="font-semibold">Для кого</span>
                  <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={selected.sampleTitle}
                  />
                </label>
                <label className="space-y-1 text-body-sm">
                  <span className="font-semibold">Дата</span>
                  <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </label>
              </div>

              {/* Имя нужно не всем шаблонам — только тем, где оно есть в текстах */}
              {usesName(selected) && (
                <label className="block space-y-1 text-body-sm">
                  <span className="font-semibold">Как зовут виновника праздника</span>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder={selected.sampleName} maxLength={40} />
                  <span className="block text-caption text-muted-foreground">Подставится в тексты страницы</span>
                </label>
              )}

              <div className="space-y-2">
                <Button className="w-full" onClick={handleCreate} disabled={isPending} loading={isPending}>
                  Создать по шаблону
                </Button>
                <p className="text-center text-caption text-muted-foreground">
                  Тексты шаблона — пример: поправьте под себя, лишние блоки можно скрыть
                </p>
              </div>
            </aside>
          )}
        </div>

        {/* Свои сохранённые шаблоны — уже другая сущность: они принадлежат
            человеку и могут быть опубликованы в общей витрине. */}
        {USER_TEMPLATES_ENABLED && <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-title-sm font-bold">Мои шаблоны</h2>
            <Button variant="ghost" size="sm" asChild className="gap-1.5 text-caption">
              <Link href="/templates">
                <LayoutTemplate size={14} aria-hidden />
                Шаблоны сообщества
              </Link>
            </Button>
          </div>

          {myTemplates.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              Пока пусто. Любой свой вишлист можно сохранить как шаблон — из меню вишлиста.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {myTemplates.map(template => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setUserTemplate(template)}
                  disabled={userPending}
                  className="rounded-card overflow-hidden border border-border hover:border-primary transition-colors text-left disabled:opacity-60"
                >
                  <div className="px-4 pt-4 pb-3 text-body-sm font-semibold line-clamp-2">{template.name}</div>
                  <div className="px-3.5 py-2 text-caption text-muted-foreground border-t">
                    {template.blocks?.length ?? 0}{' '}
                    {pluralRu(template.blocks?.length ?? 0, ['блок', 'блока', 'блоков'])}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>}

        <FromUserTemplateDialog
          template={userTemplate}
          open={Boolean(userTemplate)}
          onOpenChange={open => { if (!open) setUserTemplate(null) }}
          onSubmit={handleUserTemplate}
          isPending={userPending}
        />
      </div>
    </>
  )
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'h-control px-3.5 rounded-full border text-body-sm font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-foreground text-background border-foreground'
          : 'text-muted-foreground border-border hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}
