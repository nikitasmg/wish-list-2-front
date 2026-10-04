import api from '@/lib/api'
import { Block, RowSettings, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetAllWishlists = () => {
  return useQuery({
    queryKey: [ 'wishlists' ],
    queryFn: async () => api.get<{ data: Wishlist[] }>('wishlists'),
  })
}

export const useApiGetWishlistById = (id: string) => {
  return useQuery<{ data: Wishlist }>({
    queryKey: [ 'wishlist', id ],
    queryFn: async () => api.get<{ data: Wishlist }>(`wishlists/${id}`),
  })
}

export const useApiGetWishlistByShortId = (shortId: string) => {
  return useQuery<{ data: Wishlist }>({
    queryKey: [ 'wishlist-short', shortId ],
    queryFn: async () => api.get<{ data: Wishlist }>(`wishlists/s/${shortId}`),
    enabled: !!shortId,
  })
}

export const useApiCreateWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, FormData>({
    mutationFn: async data => {
      return api.post('wishlists', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
      return api.put(`wishlists/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
      await queryClient.invalidateQueries({ queryKey: [ 'wishlist', id ] })
    },
  })
}

export const useApiUpdateConstructorMeta = useApiEditWishlist

type CreateConstructorInput = {
  title: string
  description?: string
  coverUrl?: string
  colorScheme?: string
  showGiftAvailability?: boolean
  presentsLayout?: string
  locationName?: string
  locationLink?: string
  locationTime?: string
  blocks?: Block[]
  rows?: RowSettings[]
  /** RFC3339 */
  eventDate?: string
}

export const useApiCreateConstructorWishlist = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, CreateConstructorInput>({
    mutationFn: async (input) => {
      return api.post('wishlists/constructor', {
        title: input.title,
        description: input.description ?? '',
        cover_url: input.coverUrl ?? '',
        // 'space' — схема сайта по умолчанию. Прежний 'main' в новый набор не
        // входит и уезжал в запасной вариант при каждом создании.
        color_scheme: input.colorScheme ?? 'space',
        show_gift_availability: input.showGiftAvailability ?? false,
        presents_layout: input.presentsLayout ?? 'list',
        location_name: input.locationName ?? '',
        location_link: input.locationLink ?? '',
        location_time: input.locationTime ?? '',
        blocks: input.blocks ?? [],
        rows: input.rows ?? [],
        event_date: input.eventDate ?? '',
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}

export const useApiUpdateWishlistBlocks = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, Block[]>({
    mutationFn: async (blocks) => {
      return api.put(`wishlists/${id}/blocks`, blocks)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlist', id ] })
    },
  })
}

export const useApiDeleteWishlist = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError>({
    mutationFn: async () => {
      return api.delete(`wishlists/${id}`)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ 'wishlists' ] })
    },
  })
}
