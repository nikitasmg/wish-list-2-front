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
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useApiCreateTemplate } from '@/api/template'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

const schema = z.object({
  name: z.string().min(1, { message: 'Название обязательно' }).max(200),
})
type FormData = z.infer<typeof schema>

type Props = {
  wishlistId: string
  wishlistTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaveAsTemplateModal({ wishlistId, wishlistTitle, open, onOpenChange }: Props) {
  const [isPublic, setIsPublic] = React.useState(false)
  const { mutate, isPending } = useApiCreateTemplate()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: wishlistTitle },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ name: wishlistTitle })
      setIsPublic(false)
    }
  }, [open, wishlistTitle, form])

  const handleSubmit = (data: FormData) => {
    mutate(
      { wishlistId, name: data.name, isPublic },
      {
        onSuccess: () => {
          onOpenChange(false)
          toast({
            title: 'Шаблон сохранён',
            description: (
              <button
                className="underline text-sm"
                onClick={() => router.push('/templates')}
              >
                Посмотреть в пользовательских шаблонах →
              </button>
            ),
          })
        },
        onError: () => {
          toast({ title: 'Ошибка сохранения шаблона', variant: 'destructive' })
        },
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Сохранить как шаблон</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название шаблона</FormLabel>
                  <FormControl>
                    <Input placeholder="Мой шаблон" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="is-public">Сделать публичным</Label>
              <Switch
                id="is-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
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
              <Button type="submit" className="flex-[2]" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Сохранить шаблон
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
