import api from '@/lib/api'
import { Template, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

export const useApiGetPublicTemplates = (cursor?: string) => {
  return useQuery({
    queryKey: ['templates-public', cursor ?? ''],
    queryFn: async () =>
      api.get<{ data: Template[]; nextCursor: string | null }>(
        `templates${cursor ? `?cursor=${cursor}` : ''}`,
      ),
  })
}

export const useApiGetMyTemplates = () => {
  return useQuery({
    queryKey: ['templates-my'],
    queryFn: async () => api.get<{ data: Template[] }>('templates/my'),
  })
}

export const useApiCreateTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: Template },
    AxiosError,
    { wishlistId: string; name: string; isPublic: boolean }
  >({
    mutationFn: async (body) => api.post('templates', body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates-my'] })
    },
  })
}

export const useApiUpdateTemplate = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: Template },
    AxiosError,
    { name: string; isPublic: boolean }
  >({
    mutationFn: async (body) => api.patch(`templates/${id}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates-my'] })
    },
  })
}

export const useApiDeleteTemplate = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<{ data: boolean }, AxiosError>({
    mutationFn: async () => api.delete(`templates/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['templates-my'] })
    },
  })
}

export const useApiCreateWishlistFromTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, { templateId: string; title: string }>({
    mutationFn: async ({ templateId, title }) =>
      api.post(`wishlists/from-template/${templateId}`, { title }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlists'] })
    },
  })
}
