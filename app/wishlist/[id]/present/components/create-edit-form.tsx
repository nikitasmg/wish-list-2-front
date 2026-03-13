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
    },
  })

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
