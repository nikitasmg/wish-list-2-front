import api from '@/lib/api'
import { User } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetMe = () => {
  return useQuery<{user: User}>({
    queryKey: ['me'],
    queryFn: async () => api.get<{user: User}>('auth/me')
  })
}

export const useApiLogout = () => {
  return useMutation({
    mutationFn: async () => api.post('auth/logout', {}),
  })
}

export const useApiGetMyProfile = () => {
  return useQuery<{ user: User }>({
    queryKey: ['my-profile'],
    queryFn: async () => api.get<{ user: User }>('users/me'),
  })
}

export const useApiUpdateMe = () => {
  const queryClient = useQueryClient()
  return useMutation<{ user: User }, AxiosError, FormData>({
    mutationFn: async (data) =>
      api.patch('users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })
}
