import api from '@/lib/api'
import { SystemTemplate, SystemTemplateCategory, Wishlist } from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

/**
 * Системные заготовки — не то же самое, что шаблоны пользователей из
 * `api/template`. Эти идут вместе с релизом, одинаковы для всех и живут
 * только на экране создания вишлиста: ни автора, ни лайков, ни публикации.
 */
type SystemTemplatesResponse = {
  templates: SystemTemplate[]
  categories: SystemTemplateCategory[]
}

/**
 * Витрина заготовок. Она не меняется между релизами, поэтому кэш живёт долго:
 * перезапрашивать её при каждом возврате на страницу незачем.
 */
export const useApiGetSystemTemplates = () => {
  return useQuery({
    queryKey: ['system-templates'],
    queryFn: async () => api.get<{ data: SystemTemplatesResponse }>('system-templates'),
    staleTime: 60 * 60 * 1000,
  })
}

export type CreateFromSystemTemplateInput = {
  template_id: string
  title?: string
  /** Имя для {name} в текстах шаблона; пусто — имя-пример. */
  name?: string
  /** RFC3339; бэк отвергает другие форматы. */
  event_date?: string
}

export const useApiCreateFromSystemTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation<{ data: Wishlist }, AxiosError, CreateFromSystemTemplateInput>({
    mutationFn: async input => api.post('wishlists/from-system-template', input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['wishlists'] })
    },
  })
}
