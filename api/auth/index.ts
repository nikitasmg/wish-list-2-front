import api from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type AuthProps = {
  username: string
  password: string
}

export const useApiLogin = () => {
  return useMutation<{ token: string }, AxiosError, AuthProps>({
    mutationFn: async data => {
      return api.post<{ token: string }, AuthProps>('login', data)
    },
  })
}

export const useApiRegister = () => {
  return useMutation<{ token: string }, AxiosError, AuthProps>({
    mutationFn: async data => {
      return api.post<{ token: string }, AuthProps>('register', data)
    },
  })
}