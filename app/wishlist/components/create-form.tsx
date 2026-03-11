'use client'

import { useApiCreateWishlist, useApiEditWishlist } from '@/api/wishlist'
import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import { DatePicker } from '@/app/wishlist/components/date-picker'
import { ImageUpload, ImageUploadValue } from '@/components/image-upload'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Wishlist } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const locationLink = z.string().refine(value => {
  if (!value) return true
  const regex = /^(https?:\/\/(go\.2gis\.com|2gis\.ru|yandex\.ru)\/[^\s]+)/
  return regex.test(value ?? '')
}, { message: 'Некорректная ссылка' }).optional()

type Props = {
  edit?: boolean
  wishlist?: Wishlist
}

export function CreateForm({ edit, wishlist }: Props) {
  const FormSchema = z.object({
    title: z.string().min(1, { message: 'Название обязательно' }),
    description: z.string(),
    settings: z.object({
      colorScheme: z.string(),
      showGiftAvailability: z.boolean(),
      presentsLayout: z.enum(['list', 'grid2', 'grid3']),
    }),
    location: z.object({
      name: z.string().optional(),
      link: locationLink,
      time: z.date().optional(),
    }).optional(),
  })

  const { mutate: createMutate } = useApiCreateWishlist()
  const { mutate: editMutate } = useApiEditWishlist(wishlist?.id ?? '')
  const navigation = useRouter()
  const [coverValue, setCoverValue] = useState<ImageUploadValue | null>(null)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: edit ? wishlist?.title : '',
      description: edit ? wishlist?.description : '',
      settings: {
        colorScheme: edit ? wishlist?.settings.colorScheme : 'main',
        showGiftAvailability: edit ? wishlist?.settings.showGiftAvailability : false,
        presentsLayout: (edit ? wishlist?.settings.presentsLayout : undefined) ?? 'list',
      },
      location: {
        name: edit ? wishlist?.location.name : '',
        link: edit ? wishlist?.location.link : '',
        time: wishlist?.location.time ? new Date(wishlist.location.time) : undefined,
      },
    },
  })

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)

    if (coverValue?.type === 'file') {
      formData.append('file', coverValue.value)
    } else if (coverValue?.type === 'url') {
      formData.append('cover_url', coverValue.value)
    } else if (edit && wishlist?.cover) {
      formData.append('cover_url', wishlist.cover)
    }

    formData.append('settings[colorScheme]', data.settings.colorScheme)
    formData.append('settings[showGiftAvailability]', String(data.settings.showGiftAvailability))
    formData.append('settings[presentsLayout]', data.settings.presentsLayout)
    formData.append('location[name]', data.location?.name ?? '')
    formData.append('location[link]', data.location?.link ?? '')
    if (data.location?.time) {
      formData.append('location[time]', data.location.time.toISOString())
    }

    if (edit && wishlist) {
      editMutate(formData, {
        onSuccess: () => navigation.push('/wishlist'),
      })
    } else {
      createMutate(formData, {
        onSuccess: () => navigation.push('/wishlist'),
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Основная информация</span>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название*</FormLabel>
              <FormControl>
                <Input placeholder="Мой день рождения" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Дата и локация</span>
        </div>

        <FormField
          control={form.control}
          name="location.time"
          render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} />
          )}
        />
        <FormField
          control={form.control}
          name="location.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Место проведения</FormLabel>
              <FormControl>
                <Input placeholder="Название места проведения" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location.link"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ссылка на геопозицию</FormLabel>
              <FormControl>
                <Input placeholder="Ссылка на место в 2gis/Yandex" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Детали праздника</span>
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Что будет на празднике, программа развлечений и тд" className="resize-none h-[200px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ImageUpload
          label="Обложка"
          onChange={setCoverValue}
          previewUrl={edit ? wishlist?.cover : undefined}
        />

        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-background px-2 text-muted-foreground">Настройки</span>
        </div>

        <FormField
          control={form.control}
          name="settings.colorScheme"
          render={({ field }) => (
            <ColorsSelect value={field.value} onChange={field.onChange} />
          )}
        />
        <FormField
          control={form.control}
          name="settings.showGiftAvailability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Видимость брони</FormLabel>
                <FormDescription>Если хотите видеть, что кто-то забронировал подарок</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} aria-readonly />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="settings.presentsLayout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Раскладка подарков</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="list">Список</SelectItem>
                  <SelectItem value="grid2">Сетка 2 колонки</SelectItem>
                  <SelectItem value="grid3">Сетка 3 колонки</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {edit ? 'Сохранить' : 'Создать'}
        </Button>
      </form>
    </Form>
  )
}
