'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Toggle } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type RoomFormValues, roomSchema } from '@/shared/santa'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

const BUDGETS = [['1000', '1 000'], ['3000', '3 000'], ['5000', '5 000'], ['', 'Без лимита']] as const

export function RoomForm({ defaultValues, showOrganizer, submitLabel, pending, onSubmit }: {
  defaultValues: RoomFormValues
  /** Только при создании: «я тоже участвую». */
  showOrganizer: boolean
  submitLabel: string
  pending: boolean
  onSubmit: (values: RoomFormValues) => void
}) {
  const form = useForm<RoomFormValues>({ resolver: zodResolver(roomSchema), defaultValues })
  const joins = form.watch('organizerJoins')
  const budget = form.watch('budget')

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>Название</FormLabel>
            <FormControl><Input placeholder="Новый год в отделе дизайна" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="budget" render={({ field }) => (
            <FormItem>
              <FormLabel>Бюджет на подарок, ₽</FormLabel>
              <FormControl><Input inputMode="numeric" placeholder="Без лимита" {...field} /></FormControl>
              <div className="flex flex-wrap gap-1.5">
                {BUDGETS.map(([value, label]) => (
                  <Button
                    key={label}
                    type="button"
                    size="sm"
                    variant={budget === value ? 'default' : 'secondary'}
                    aria-pressed={budget === value}
                    onClick={() => form.setValue('budget', value, { shouldValidate: true })}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="exchangeDate" render={({ field }) => (
            <FormItem>
              <FormLabel>Дата обмена подарками</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>Пара слов участникам — необязательно</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Например: дарим в пятницу на офисной ёлке" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        {showOrganizer && (
          <div className="space-y-4 rounded-card border border-border bg-card p-5">
            <FormField control={form.control} name="organizerJoins" render={({ field }) => (
              <FormItem>
                <Toggle checked={field.value} onChange={field.onChange} label="Я тоже участвую" />
                <p className="text-caption text-muted-foreground">
                  Пары не увидит никто, и вы тоже: для организатора результат такой же тайный.
                </p>
              </FormItem>
            )} />
            {joins && (
              <>
                <FormField control={form.control} name="organizerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ваше имя в комнате</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="organizerWishes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Что хотели бы получить</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="Хобби, размеры, что точно не дарить" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
          </div>
        )}

        <Button type="submit" variant="festive" size="xl" loading={pending}>{submitLabel}</Button>
      </form>
    </Form>
  )
}
