import api from '@/lib/api'
import { Template, Wishlist } from '@/shared/types'
import { QueryKey, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type PublicTemplatesResponse = { data: Template[]; hasMore: boolean }

export const useApiGetPublicTemplates = (page: number) => {
  return useQuery({
    queryKey: ['templates-public', page],
    queryFn: async () =>
      api.get<PublicTemplatesResponse>(`templates?page=${page}`),
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

type MutationContext = {
  previousData: [QueryKey, PublicTemplatesResponse | undefined][]
}

export const useApiLikeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: { likesCount: number; likedByMe: boolean } },
    AxiosError,
    string,
    MutationContext
  >({
    mutationFn: async (templateId) => api.post(`templates/${templateId}/like`),
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ['templates-public'] })
      const previousData = queryClient.getQueriesData<PublicTemplatesResponse>({
        queryKey: ['templates-public'],
      })
      queryClient.setQueriesData<PublicTemplatesResponse>(
        { queryKey: ['templates-public'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === templateId
                ? { ...t, likesCount: t.likesCount + 1, likedByMe: true }
                : t,
            ),
          }
        },
      )
      return { previousData }
    },
    onError: (_err, _id, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        if (data !== undefined) {
          queryClient.setQueryData(queryKey, data)
        }
      })
    }
  })
}

export const useApiUnlikeTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<
    { data: { likesCount: number; likedByMe: boolean } },
    AxiosError,
    string,
    MutationContext
  >({
    mutationFn: async (templateId) => api.delete(`templates/${templateId}/like`),
    onMutate: async (templateId) => {
      await queryClient.cancelQueries({ queryKey: ['templates-public'] })
      const previousData = queryClient.getQueriesData<PublicTemplatesResponse>({
        queryKey: ['templates-public'],
      })
      queryClient.setQueriesData<PublicTemplatesResponse>(
        { queryKey: ['templates-public'] },
        (old) => {
          if (!old) return old
          return {
            ...old,
            data: old.data.map((t) =>
              t.id === templateId
                ? { ...t, likesCount: Math.max(0, t.likesCount - 1), likedByMe: false }
                : t,
            ),
          }
        },
      )
      return { previousData }
    },
    onError: (_err, _id, context) => {
      context?.previousData.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data)
      })
    },
  })
}
