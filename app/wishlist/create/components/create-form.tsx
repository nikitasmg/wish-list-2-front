'use client'

import { useApiCreateWishlist, useApiEditWishlist } from '@/api/wishlist'
import { Textarea } from '@/components/ui/textarea'
import { Wishlist } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
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

const fileSchema = z.instanceof(File)
  .refine(file => file.size <= 2 * 1024 * 1024, { // Ограничиваем размер файла до 2MB
    message: 'Файл должен быть менее 2MB',
  }).nullable()

const FormSchema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
  description: z.string(),
  file: fileSchema,
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

  function onSubmit(data: z.infer<typeof FormSchema>) {
    const formData = new FormData()
    formData.append('title', data.title)
    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.file) {
      formData.append('file', data.file)
    }
    if (edit) {
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

  // @ts-ignore
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
                <Input placeholder="Мой день рождения" {...field} />
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
                <Textarea {...field} placeholder="Что будет на празднике время, дата, место и тд"
                          className="resize-none h-[200px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {imageUrl && (
          <div className="relative w-[200px] h-full">
            <Image
              src={imageUrl} // Путь к вашему изображению
              alt={wishlist?.title ?? 'wishlist cover'}
              layout="responsive" // Или "fill", в зависимости от ваших нужд
              width={200} // Укажите ширину изображения
              height={300} // Укажите высоту изображения
              objectFit="contain" // Убедитесь, что изображение сохраняет пропорции
            />
          </div>
        )}
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
        <Button type="submit" className="w-full">
          {edit ? 'Сохранить' : 'Создать'}
        </Button>
      </form>
    </Form>
  )
}
