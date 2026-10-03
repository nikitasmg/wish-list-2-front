'use client'

import { useApiCreatePresent, useApiEditPresent } from '@/api/present'
import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { cn } from '@/lib/utils'
import { MAX_PRESENT_DESCRIPTION, Present } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, X } from 'lucide-react'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  title: z.string().trim().min(1, { message: 'Как называется подарок?' }),
  // Тот же лимит проверяет бэк — расхождение дало бы ошибку уже после отправки.
  description: z
    .string()
    .max(MAX_PRESENT_DESCRIPTION, { message: `Не больше ${MAX_PRESENT_DESCRIPTION} символов` })
    .optional(),
  link: z
    .string()
    .refine(
      (v) => v === '' || z.string().url().safeParse(v).success,
      { message: 'Некорректный URL' }
    )
    .optional(),
  price: z
    .string()
    .refine((v) => v === '' || !isNaN(parseFloat(v ?? '')), { message: 'Значение не число' })
    .optional(),
  coverUrl: z.string().optional(),
  type: z.enum(['single', 'group', 'multi']),
  images: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
  isMain: z.boolean().optional(),
})

type FormValues = z.infer<typeof FormSchema>

type Props = {
  wishlistId: string
  present?: Present
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Вызывается только на создании: экран подарков показывает тост с отменой. */
  onCreated?: (present: Present) => void
}

export function PresentModal({ wishlistId, present, open, onOpenChange, onCreated }: Props) {
  const isEdit = !!present
  const queryClient = useQueryClient()

  const { mutate: createMutate, isPending: createPending } = useApiCreatePresent(wishlistId)
  const { mutate: editMutate, isPending: editPending } = useApiEditPresent(wishlistId)
  const isPending = createPending || editPending

  const [isImageUploading, setIsImageUploading] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: present?.title ?? '',
      description: present?.description ?? '',
      link: present?.link ?? '',
      price: present?.price != null ? String(present.price) : '',
      coverUrl: present?.cover ?? '',
      type: present?.type ?? 'single',
      images: present?.images ?? [],
      links: present?.links ?? [],
      isMain: present?.isMain ?? false,
    },
  })

  const presentType = form.watch('type')

  // Reset form when modal opens or present changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: present?.title ?? '',
        description: present?.description ?? '',
        link: present?.link ?? '',
        price: present?.price != null ? String(present.price) : '',
        coverUrl: present?.cover ?? '',
        type: present?.type ?? 'single',
        images: present?.images ?? [],
        links: present?.links ?? [],
        isMain: present?.isMain ?? false,
      })
    }
  }, [open, present, form])

  const onSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['presents', wishlistId] })
    onOpenChange(false)
  }

  async function onSubmit(data: FormValues) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    if (data.link) formData.append('link', data.link)
    if (data.price) formData.append('price', data.price)
    if (data.coverUrl) formData.append('cover_url', data.coverUrl)
    formData.append('type', data.type)
    formData.append('is_main', String(Boolean(data.isMain)))
    if (data.type === 'multi') {
      formData.append('images', JSON.stringify(data.images ?? []))
      formData.append('links', JSON.stringify((data.links ?? []).filter(Boolean)))
    }

    if (isEdit && present) {
      editMutate({ data: formData, id: present.id }, { onSuccess })
    } else {
      createMutate(formData, {
        onSuccess: res => { onSuccess(); onCreated?.(res.data) },
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Редактировать подарок' : 'Новый подарок'}</DialogTitle>
        </DialogHeader>

        {/* Форма */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип подарка</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {([
                        ['single', 'Обычный'],
                        ['group', 'Групповой'],
                        ['multi', 'Набор'],
                      ] as const).map(([val, label]) => (
                        <Button
                          key={val}
                          type="button"
                          size="sm"
                          variant={field.value === val ? 'default' : 'outline'}
                          className="grow"
                          onClick={() => field.onChange(val)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            {presentType === 'group' && (
              <p className="text-sm text-muted-foreground">
                Несколько человек смогут отметить, что хотят подарить.
              </p>
            )}

            {presentType !== 'multi' && (
              <FormField
                control={form.control}
                name="coverUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        previewUrl={field.value}
                        onUploadingChange={setIsImageUploading}
                        onChange={(val: ImageUploadValue | null) => {
                          field.onChange(val?.type === 'url' ? val.value : undefined)
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="Название подарка" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Цена, ₽</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {presentType !== 'multi' && (
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ссылка</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {presentType === 'multi' && (
              <>
                <MultiImageUpload
                  value={form.watch('images') ?? []}
                  onChange={(urls) => form.setValue('images', urls)}
                  onUploadingChange={setIsImageUploading}
                />
                <div className="space-y-2">
                  <FormLabel>Ссылки</FormLabel>
                  {(form.watch('links') ?? []).map((_, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={form.watch('links')?.[i] ?? ''}
                        onChange={(e) => {
                          const next = [...(form.watch('links') ?? [])]
                          next[i] = e.target.value
                          form.setValue('links', next)
                        }}
                      />
                      <Button type="button" variant="outline" size="icon"
                        onClick={() => {
                          const next = (form.watch('links') ?? []).filter((_, idx) => idx !== i)
                          form.setValue('links', next)
                        }}>
                        <X size={16} />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => form.setValue('links', [...(form.watch('links') ?? []), ''])}>
                    <Plus size={16} className="mr-1" /> Добавить ссылку
                  </Button>
                </div>
              </>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => {
                const used = field.value?.length ?? 0
                const left = MAX_PRESENT_DESCRIPTION - used
                // Предупреждаем не на самом лимите, а за 20 символов до него:
                // иначе человек упирается в стену на середине мысли.
                const nearLimit = left <= 20

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Описание</FormLabel>
                      <span className={cn(
                        'text-xs tabular-nums',
                        nearLimit ? 'text-amber-500 font-semibold' : 'text-muted-foreground',
                      )}>
                        {used} / {MAX_PRESENT_DESCRIPTION}
                      </span>
                    </div>
                    <FormControl>
                      <Textarea
                        placeholder="Размер, цвет, модель — всё, что поможет не ошибиться"
                        className="resize-none h-[80px]"
                        maxLength={MAX_PRESENT_DESCRIPTION}
                        {...field}
                      />
                    </FormControl>
                    {nearLimit && left >= 0 && (
                      <p className="text-xs text-amber-500">Осталось {left} символов</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <button
              type="button"
              aria-pressed={Boolean(form.watch('isMain'))}
              onClick={() => form.setValue('isMain', !form.watch('isMain'))}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                form.watch('isMain') ? 'border-primary bg-primary/10' : 'hover:border-primary/50',
              )}
            >
              <span className={cn('text-xl', form.watch('isMain') ? 'text-primary' : 'text-muted-foreground')} aria-hidden>★</span>
              <span>
                <span className="block text-sm font-bold">Главная мечта</span>
                <span className="block text-xs text-muted-foreground">Покажем первой и крупнее остальных</span>
              </span>
            </button>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isPending || isImageUploading}
                loading={isPending}
              >
                {isImageUploading ? 'Загрузка фото…' : isEdit ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
