import api from '@/lib/api'
import { Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetAllWishlists = () => {
  return useQuery({
    queryKey: [ 'wishlists' ],
    queryFn: async () => api.get<{ data: Wishlist[] }>('wishlist'),
  })
}

export const useApiGetWishlistById = (id: string) => {
  return useQuery<{ data: Wishlist }>({
    queryKey: [ 'wishlist', id ],
    queryFn: async () => api.get<{ data: Wishlist }>(`wishlist/${id}`),
  })
}

export const useApiCreateWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.post('wishlist', data, {
        headers: {
          "Content-Type": 'multipart/form-data',
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}

export const useApiEditWishlist = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.put(`wishlist/${id}`, data, {
        headers: {
          "Content-Type": 'multipart/form-data',
        },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
      await queryClient.invalidateQueries({ queryKey: [ 'wishlist', id ] })
    },
  })
}

export const useApiDeleteWishlist = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError>({
    mutationFn: async () => {
      return api.delete(`wishlist/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}