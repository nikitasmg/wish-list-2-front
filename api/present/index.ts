import api from '@/lib/api'
import { Present } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetAllPresents = (wishlistId: string) => {
  return useQuery({
    queryKey: [ 'presents', wishlistId ],
    queryFn: async () => api.get<{ data: Present[] }>(`wishlist/${wishlistId}/presents`),
  })
}

export const useApiGetPresentById = (id: string) => {
  return useQuery<{ data: Present }>({
    queryKey: [ 'present', id ],
    queryFn: async () => api.get<{ data: Present }>(`present/${id}`),
  })
}

export const useApiCreatePresent = (wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Present }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.post(`present/${wishlistId}`, data, {
        headers: {
          "Content-Type": 'multipart/form-data',
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
    },
  })
}

export const useApiEditPresent = (wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Present }, AxiosError, { data: FormData, id: string }>({
    mutationFn: async ({ data, id }) => {
      return api.put(`present/${id}`, data, {
        headers: {
          "Content-Type": 'multipart/form-data',
        },
      })
    },
    onSuccess: async (_, { id }) => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
      await queryClient.invalidateQueries({ queryKey: [ 'present', id ] })
    },
  })
}

export const useApiDeletePresent = (id: string, wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Present }, AxiosError>({
    mutationFn: async () => {
      return api.delete(`present/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
    },
  })
}