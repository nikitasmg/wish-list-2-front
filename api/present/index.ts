import api from '@/lib/api'
import { Present } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export type ParseResult = {
  title: string
  description: string
  price: number | null
  image_url: string
  category: string
  brand: string
  source: string
}

export const useApiParseUrl = () => {
  return useMutation<{ data: ParseResult }, AxiosError, string>({
    mutationFn: async (url: string) => {
      return api.get(`parse?url=${encodeURIComponent(url)}`)
    },
  })
}

export const useApiGetAllPresents = (wishlistId: string) => {
  return useQuery({
    queryKey: [ 'presents', wishlistId ],
    queryFn: async () => api.get<{ data: Present[] }>(`wishlists/${wishlistId}/presents`),
  })
}

export const useApiGetPresentById = (id: string) => {
  return useQuery<{ data: Present }>({
    queryKey: [ 'present', id ],
    queryFn: async () => api.get<{ data: Present }>(`presents/${id}`),
  })
}

export const useApiCreatePresent = (wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Present }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.post(`wishlists/${wishlistId}/presents`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
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
      return api.put(`presents/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
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
      return api.delete(`wishlists/${wishlistId}/presents/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
    },
  })
}

export const useApiReservePresent = (wishlistId: string) => {
  const queryClient = useQueryClient()
  return useMutation<unknown, AxiosError, { presentId: string }>({
    mutationFn: async ({ presentId }) => {
      return api.put(`presents/${presentId}/reserve`, {})
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'presents', wishlistId ] })
    },
  })
}
