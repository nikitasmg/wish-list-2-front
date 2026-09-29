import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
export function useGuestData<T>(wishlistId: string, blockId: string, kind: string, owner = false) {
  const client = useQueryClient()
  const key = ['guest-data', wishlistId, blockId, kind, owner]
  const base = `wishlists/${wishlistId}/blocks/${encodeURIComponent(blockId)}/${kind}`
  const suffix = owner ? kind === 'rsvp' ? '/summary' : kind === 'guestbook' ? '/all' : '' : ''
  const query = useQuery({ queryKey: key, queryFn: () => api.get<{ data: T }>(base + suffix), enabled: Boolean(wishlistId && blockId), retry: false })
  const mutation = useMutation({ mutationFn: (body: Record<string, unknown>) => api.post(base, body), onSuccess: () => client.invalidateQueries({ queryKey: ['guest-data', wishlistId, blockId] }) })
  return { ...query, result: query.data?.data, mutation, refresh: () => client.invalidateQueries({ queryKey: ['guest-data', wishlistId, blockId] }) }
}
