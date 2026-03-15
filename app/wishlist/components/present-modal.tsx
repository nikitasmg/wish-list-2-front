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
import { Present } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const FormSchema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
  description: z.string().optional(),
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
})

type FormValues = z.infer<typeof FormSchema>

type Props = {
  wishlistId: string
  present?: Present
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PresentModal({ wishlistId, present, open, onOpenChange }: Props) {
  const isEdit = !!present
  const queryClient = useQueryClient()

  const { mutate: createMutate, isPending: createPending } = useApiCreatePresent(wishlistId)
  const { mutate: editMutate, isPending: editPending } = useApiEditPresent(wishlistId)
  const isPending = createPending || editPending

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: present?.title ?? '',
      description: present?.description ?? '',
      link: present?.link ?? '',
      price: present?.price != null ? String(present.price) : '',
      coverUrl: present?.cover ?? '',
    },
  })

  // Reset form when modal opens or present changes
  React.useEffect(() => {
    if (open) {
      form.reset({
        title: present?.title ?? '',
        description: present?.description ?? '',
        link: present?.link ?? '',
        price: present?.price != null ? String(present.price) : '',
        coverUrl: present?.cover ?? '',
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

    if (isEdit && present) {
      editMutate({ data: formData, id: present.id }, { onSuccess })
    } else {
      createMutate(formData, { onSuccess })
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
              name="coverUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUpload
                      previewUrl={field.value}
                      onChange={(val: ImageUploadValue | null) => {
                        field.onChange(val?.type === 'url' ? val.value : undefined)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Описание подарка"
                      className="resize-none h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={isPending || !form.watch('title')}
                loading={isPending}
              >
                {isEdit ? 'Сохранить' : 'Добавить'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
