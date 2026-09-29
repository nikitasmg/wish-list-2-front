import api from '@/lib/api'
import { Template, TemplateCategory, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

type TemplatesResponse = {
  templates: Template[]
  categories: TemplateCategory[]
}

/**
 * Витрина шаблонов. Публичная и неизменная между релизами, поэтому кэш живёт
 * долго: перезапрашивать её при каждом возврате на страницу незачем.
 */
export const useApiGetTemplates = () => {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => api.get<{ data: TemplatesResponse }>('templates'),
    staleTime: 60 * 60 * 1000,
  })
}

export type CreateFromTemplateInput = {
  template_id: string
  title?: string
  /** RFC3339; бэк отвергает другие форматы. */
  event_date?: string
}

export const useApiCreateFromTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, CreateFromTemplateInput>({
    mutationFn: async input => api.post('wishlists/from-template', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlists'] })
    },
  })
}
