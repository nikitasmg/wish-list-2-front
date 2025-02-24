'use client'

import { useApiCreateWishlist, useApiEditWishlist } from '@/api/wishlist'
import { ColorsSelect } from '@/app/wishlist/components/colors-select'
import { DatePicker } from '@/app/wishlist/components/date-picker'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createFileFromUrl } from '@/lib/utils'
import { Wishlist } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { LucideFileQuestion } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl, FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { Input } from '@/components/ui/input'


const fileSchema = z.any()
  .refine(file => file instanceof File && file.size <= 2 * 1024 * 1024, {
    message: 'Файл должен быть менее 2MB',
  }).optional()

const locationLink = z.string().refine(value => {
  const regex = /^(https?:\/\/(go\.2gis\.com|2gis\.ru|yandex\.ru)\/[^\s]+)/ // Регулярное выражение для проверки ссылок
  return regex.test(value ?? '')
}).optional()

const FormSchema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
  description: z.string(),
  file: fileSchema,
  settings: z.object({
    colorScheme: z.string(),
    showGiftAvailability: z.boolean(),
  }),
  location: z.object({
    name: z.string().optional(),
    link: locationLink,
    time: z.date().optional(),
  }).optional(),
})

type Props = {
  edit?: boolean
  wishlist?: Wishlist
}

export function CreateForm({ edit, wishlist }: Props) {
  const { mutate: createMutate } = useApiCreateWishlist()
  const { mutate: editMutate } = useApiEditWishlist(wishlist?.id ?? '')
  const navigation = useRouter()
  const [ imageUrl, setImageUrl ] = useState<string | undefined>(wishlist?.cover)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: edit ? wishlist?.title : '',
      description: edit ? wishlist?.description : '',
      file: null,
      settings: {
        colorScheme: edit ? wishlist?.settings.colorScheme : 'main',
        showGiftAvailability: edit ? wishlist?.settings.showGiftAvailability : false,
      },
      location: {
        name: edit ? wishlist?.location.name : '',
        link: edit ? wishlist?.location.link : '',
        time: wishlist?.location.time ? new Date(wishlist?.location.time) : undefined,
      },
    },
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] // Получаем первый файл из списка

    if (file) {
      const url = URL.createObjectURL(file) // Создаем временный URL для файла
      setImageUrl(url)

      // Освобождаем память после использования URL (это важно)
      file.arrayBuffer().then(() => {
        URL.revokeObjectURL(url)
      })
    }
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.file) {
      formData.append('file', data.file)
    }

    formData.append('settings[colorScheme]', data.settings.colorScheme)
    formData.append('settings[showGiftAvailability]', String(data.settings.showGiftAvailability))
    formData.append('location[name]', data.location?.name ?? '')
    formData.append('location[link]', data.location?.link ?? '')
    if (data.location?.time) {
      formData.append('location[time]', data.location.time.toISOString())
    }
    if (edit && wishlist) {
      if (!data.file && wishlist.cover) {
        if (typeof window !== "undefined") {
          const file = await createFileFromUrl(wishlist.cover, wishlist.title);
          formData.append('file', file);
        }
      }
      editMutate(formData, {
        onSuccess: () => {
          navigation.push('/wishlist')
        },
      })
    } else {
      createMutate(formData, {
        onSuccess: () => {
          navigation.push('/wishlist')
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <div
          className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Основная информация
                </span>
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
        <div
          className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Дата и локация
                </span>
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
        <div
          className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Детали праздника
                </span>
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Что будет на празднике, программа развлечений и тд"
                          className="resize-none h-[200px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='flex items-center justify-between min-h-[200px] gap-8'>
          {imageUrl ? (
              <div className="relative w-[200px] h-[200px] rounded-lg">
                <Image
                  className="rounded-lg"
                  src={imageUrl}
                  alt={wishlist?.title ?? 'wishlist cover'}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
            )
            : <div
              className="relative w-[200px] max-w-[50%] h-[200px] rounded-lg bg-secondary flex justify-center items-center">
              <LucideFileQuestion className='stroke-accent-foreground' size={40} />
            </div>
          }
          <div className='flex-grow'>
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Обложка</FormLabel>
                  <FormControl>
                    <Input
                      accept=".jpg, .jpeg, .png"
                      type="file"
                      onChange={(e) => {
                        handleFileChange(e)
                        field.onChange(e.target.files ? e.target.files[0] : null)
                      }
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        </div>
        <div
          className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Настройки
                </span>
        </div>
        <FormField
          control={form.control}
          name="settings.colorScheme"
          render={({ field }) => (
            <ColorsSelect value={field.value} onChange={field.onChange} />
          )} />
        <FormField
          control={form.control}
          name="settings.showGiftAvailability"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Видимость брони</FormLabel>
                <FormDescription>
                  Если хотите видеть, что кто-то забронировал подарок
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-readonly
                />
              </FormControl>
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
