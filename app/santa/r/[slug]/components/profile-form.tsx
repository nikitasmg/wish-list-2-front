'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { type ProfileValues, profileSchema } from '@/shared/santa'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { type WishlistOption, WishlistPicker } from './wishlist-picker'

export function ProfileForm({ defaultValues, nameLocked = false, wishlists = [], submitLabel, pending, onSubmit }: {
  defaultValues: ProfileValues
  /** После жеребьёвки имя уже знает Санта — не меняем. */
  nameLocked?: boolean
  /** Свои вишлисты вошедшего — выбором вместо ссылки. */
  wishlists?: WishlistOption[]
  submitLabel: string
  pending: boolean
  onSubmit: (values: ProfileValues) => void
}) {
  const form = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Как вас зовут</FormLabel>
            <FormControl><Input placeholder="Имя, которое увидит ваш Санта" disabled={nameLocked} {...field} /></FormControl>
            {nameLocked && <p className="text-caption text-muted-foreground">Имя уже знает ваш Санта — оно не меняется.</p>}
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="wishes" render={({ field }) => (
          <FormItem>
            <FormLabel>Что хотели бы получить</FormLabel>
            <FormControl><Textarea rows={4} placeholder="Хобби, размеры, что точно не дарить" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="wishlistUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>{wishlists.length > 0 ? 'Вишлист — необязательно' : 'Ссылка на вишлист — необязательно'}</FormLabel>
            {wishlists.length > 0 ? (
              <WishlistPicker value={field.value} onChange={field.onChange} options={wishlists} />
            ) : (
              <FormControl><Input type="url" inputMode="url" placeholder="https://prosto-namekni.ru/s/…" {...field} /></FormControl>
            )}
            {wishlists.length > 0 && <p className="text-caption text-muted-foreground">Санта увидит подарки и сможет тайно забронировать один из них.</p>}
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" variant="festive" size="lg" className="w-full md:w-auto" loading={pending}>{submitLabel}</Button>
      </form>
    </Form>
  )
}
