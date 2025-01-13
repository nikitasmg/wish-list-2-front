import api from '@/lib/api'
import { User } from '@/shared/types'
import { useMutation, useQuery } from '@tanstack/react-query'

export const useApiGetMe = () => {
  return useQuery<{user: User}>({
    queryKey: ['me'],
    queryFn: async () => api.get<{user: User}>('me')
  })
}

export const useApiLogout = () => {
  return useMutation({
    mutationFn: async () => api.get('logout'),
  })
}