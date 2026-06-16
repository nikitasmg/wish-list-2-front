'use client'

import { useApiCreatePresent, useApiEditPresent } from '@/api/present'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Present } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { Plus, X } from 'lucide-react'

type Props = {
  edit?: boolean
  present?: Present
}

export function CreateEditForm({ edit, present }: Props) {

  const FormSchema = z.object({
    title: z.string().min(1, { message: 'Название обязательно' }),
    description: z.string().optional(),
    link: z
      .string()
      .refine(
        (value) => value === undefined || value === '' || z.string().url().safeParse(value).success,
        { message: 'Некорректный URL' },
      ),
    price: z.string()
      .refine((value) => value === undefined || value === '' || !isNaN(parseFloat(value)), { message: 'Значение не число' })
      .optional(),
    coverUrl: z.string().optional(),
    type: z.enum(['single', 'group', 'multi']),
    images: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
  })

  const { id } = useParams()

  const navigation = useRouter()

  const { mutate: createMutate, isPending: createLoading } = useApiCreatePresent(id as string)
  const { mutate: editMutate, isPending: editLoading } = useApiEditPresent(id as string)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: edit ? present?.title : '',
      description: edit ? present?.description : '',
      link: edit ? present?.link : '',
      price: edit ? `${present?.price}` : undefined,
      coverUrl: edit ? present?.cover : undefined,
      type: edit ? (present?.type ?? 'single') : 'single',
      images: edit ? (present?.images ?? []) : [],
      links: edit ? (present?.links ?? []) : [],
    },
  })

  const presentType = form.watch('type')

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.link) {
      formData.append('link', data.link)
    }
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.coverUrl) {
      formData.append('cover_url', data.coverUrl)
    }
    if (data.price) {
      formData.append('price', `${data.price}`)
    }
    formData.append('type', data.type)
    if (data.type === 'multi') {
      formData.append('images', JSON.stringify(data.images ?? []))
      formData.append('links', JSON.stringify((data.links ?? []).filter(Boolean)))
    }
    if (edit && present) {
      editMutate({ data: formData, id: present.id }, {
        onSuccess: () => {
          navigation.push(`/wishlist/${id}`)
        },
      })
    } else {
      createMutate(formData, {
        onSuccess: () => {
          navigation.push(`/wishlist/${id}`)
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
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
                    ['multi', 'Многосоставной'],
                  ] as const).map(([val, label]) => (
                    <Button
                      key={val}
                      type="button"
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
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Описание"
                          className="resize-none h-[200px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цена</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <Input value={field.value ?? ''}
                         onChange={field.onChange}
                         className="w-1/2 md:w-1/4"
                         type="number"
                  />
                  ₽
                </div>
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
                  <Input {...field} placeholder="Ссылка на подарок" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
        {presentType === 'multi' && (
          <>
            <MultiImageUpload
              value={form.watch('images') ?? []}
              onChange={(urls) => form.setValue('images', urls)}
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
              <Button type="button" variant="outline"
                onClick={() => form.setValue('links', [...(form.watch('links') ?? []), ''])}>
                <Plus size={16} className="mr-1" /> Добавить ссылку
              </Button>
            </div>
          </>
        )}
        <Button type="submit"
                className="w-full"
                loading={createLoading || editLoading}
                disabled={createLoading || editLoading}>
          {edit ? 'Сохранить' : 'Создать'}
        </Button>
      </form>
    </Form>
  )
}
