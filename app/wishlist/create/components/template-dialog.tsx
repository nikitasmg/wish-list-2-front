'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { WishlistTemplate } from '@/content/templates'

const schema = z.object({
  title: z.string().min(1, { message: 'Название обязательно' }),
})

type FormData = z.infer<typeof schema>

type Props = {
  template: WishlistTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (template: WishlistTemplate, title: string, date?: Date) => void
  isPending: boolean
}

export function TemplateDialog({ template, open, onOpenChange, onSubmit, isPending }: Props) {
  const [date, setDate] = React.useState<Date | undefined>()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: '' },
  })

  React.useEffect(() => {
    if (!open) {
      form.reset()
      setDate(undefined)
    }
  }, [open, form])

  const handleSubmit = (data: FormData) => {
    if (!template) return
    onSubmit(template, data.title, date)
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${template.gradientFrom}, ${template.accentColor})`,
              }}
            >
              {template.emoji}
            </div>
            <DialogTitle>{template.label}</DialogTitle>
          </div>
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
                    <Input placeholder="День рождения Маши" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Дата события
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full pl-3 text-left font-normal',
                      !date && 'text-muted-foreground',
                    )}
                  >
                    {date ? format(date, 'PPP', { locale: ru }) : <span>Выбери дату</span>}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ru}
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

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
              <Button
                type="submit"
                className="flex-[2] text-white"
                style={{ background: template.accentColor }}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Создать вишлист
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
