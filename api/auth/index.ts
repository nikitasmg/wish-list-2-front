import api from '@/lib/api'
import { AuthProps } from '@/shared/types'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type LoginProps = {
  username: string
  password: string
}

export const useApiLogin = () => {
  return useMutation<{ token: string }, AxiosError, LoginProps>({
    mutationFn: async data => {
      return api.post<{ token: string }, LoginProps>('auth/login', data)
    },
  })
}

export const useApiRegister = () => {
  return useMutation<{ token: string }, AxiosError, LoginProps>({
    mutationFn: async data => {
      return api.post<{ token: string }, LoginProps>('auth/register', data)
    },
  })
}

export const useApiAuth = () => {
  return useMutation<{ token: string }, AxiosError, AuthProps>({
    mutationFn: async data => {
      return api.post<{ token: string }, AuthProps>('auth/telegram', data)
    },
  })
}
