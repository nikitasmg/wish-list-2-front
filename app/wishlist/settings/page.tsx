'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Camera } from 'lucide-react'
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
import { useApiGetMyProfile, useApiUpdateMe } from '@/api/user'
import { useToast } from '@/hooks/use-toast'

const schema = z.object({
  displayName: z.string().max(100, 'Не более 100 символов'),
})
type FormData = z.infer<typeof schema>

export default function Page() {
  const { data, isLoading } = useApiGetMyProfile()
  const { mutate, isPending } = useApiUpdateMe()
  const { toast } = useToast()
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null)
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const user = data?.user

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '' },
  })

  React.useEffect(() => {
    if (user) {
      form.reset({ displayName: user.displayName ?? '' })
    }
  }, [user, form])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = (data: FormData) => {
    const fd = new FormData()
    fd.append('display_name', data.displayName)
    if (avatarFile) {
      fd.append('avatar', avatarFile)
    }
    mutate(fd, {
      onSuccess: () => {
        toast({ title: 'Профиль обновлён' })
        setAvatarFile(null)
      },
      onError: () => {
        toast({ title: 'Ошибка сохранения', variant: 'destructive' })
      },
    })
  }

  if (isLoading) return null

  const currentAvatar = avatarPreview ?? user?.avatar

  return (
    <div className="max-w-md">
      <h2 className="text-4xl mb-6">Настройки профиля</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm font-medium">Аватар</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-dashed border-border hover:border-primary transition-colors group"
            >
              {currentAvatar ? (
                <img src={currentAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl text-muted-foreground">👤</span>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Display Name */}
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Отображаемое имя</FormLabel>
                <FormControl>
                  <Input placeholder="Как тебя показывать в галерее" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Username (read-only) */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Логин</p>
            <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
              {user?.username}
            </p>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </form>
      </Form>
    </div>
  )
}
