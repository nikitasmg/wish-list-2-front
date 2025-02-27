'use client'

import { useApiLogin, useApiRegister } from '@/api/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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

const FormSchema = z.object({
  username: z.string().min(2, {
    message: 'Логин должен быть не меньше 2 символов',
  }).toLowerCase(),
  password: z.string().min(6, {
    message: 'Пароль должен быть не меньше 6 символов',
  }),
})

type Props = {
  isLogin?: boolean
}

export function AuthForm({ isLogin }: Props) {
  const { mutate: login, isPending: loginLoading } = useApiLogin()
  const { mutate: register, isPending: registerLoading } = useApiRegister()
  const navigation = useRouter()
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    if (isLogin) {
      login(data, {
        onSuccess: () => {
          navigation.push('wishlist')
        },
      })
    } else {
      register(data, {
        onSuccess: () => {
          navigation.push('wishlist')
        },
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Логин</FormLabel>
              <FormControl>
                <Input placeholder="Логин/email/телефон" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type='password' placeholder="Ваш пароль" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loginLoading || registerLoading}>
          {isLogin ? 'Войти' : 'Регистрация'}
        </Button>
      </form>
    </Form>
  )
}
