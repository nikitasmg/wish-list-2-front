'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
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
import { Template } from '@/shared/types'

const schema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
})
type FormData = z.infer<typeof schema>

type Props = {
  template: Template | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (title: string) => void
  isPending: boolean
}

export function FromUserTemplateDialog({ template, open, onOpenChange, onSubmit, isPending }: Props) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  React.useEffect(() => {
    if (!open) form.reset()
  }, [open, form])

  const handleSubmit = (data: FormData) => onSubmit(data.title)

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название вишлиста</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой вишлист" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Отмена
              </Button>
              <Button type="submit" className="flex-[2]" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать вишлист
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
