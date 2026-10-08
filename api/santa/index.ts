import api from '@/lib/api'
import { isValidRoomId, isValidSantaSlug, withChatRead } from '@/shared/santa'
import { clearSantaToken, santaHeaders, setSantaToken } from '@/shared/santa-token'
import type {
  SantaChat, SantaChatMessage, SantaChatWith, SantaInvite, SantaJoinResult, SantaMe, SantaProfileInput, SantaRoom,
  SantaRemindResult, SantaRoomDetails, SantaRoomInput, SantaRoomSummary,
} from '@/shared/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError, isAxiosError } from 'axios'

type Data<T> = { data: T }

const seg = encodeURIComponent

// Жеребьёвка по расписанию проходит на сервере — итог подтягиваем сами.
const ROOM_POLL_MS = 60_000
// Новые сообщения чата без перезагрузки страницы.
const CHAT_POLL_MS = 15_000

// ── Организатор ────────────────────────────────────────────────────

export const useApiSantaRooms = () =>
  useQuery({
    queryKey: ['santa-rooms'],
    queryFn: () => api.get<Data<SantaRoomSummary[]>>('santa/rooms'),
  })

export const useApiSantaRoom = (id: string) =>
  useQuery({
    queryKey: ['santa-room', id],
    enabled: isValidRoomId(id),
    queryFn: () => api.get<Data<SantaRoomDetails>>(`santa/rooms/${seg(id)}`),
    retry: false,
    refetchInterval: query => {
      const room = query.state.data?.data.room
      return room?.status === 'open' && room.drawAt ? ROOM_POLL_MS : false
    },
  })

export const useApiCreateSantaRoom = () => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaRoom>, AxiosError, SantaRoomInput>({
    mutationFn: body => api.post('santa/rooms', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-rooms'] }),
  })
}

export const useApiUpdateSantaRoom = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaRoom>, AxiosError, SantaRoomInput>({
    mutationFn: body => api.patch(`santa/rooms/${seg(id)}`, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['santa-room', id] })
      await queryClient.invalidateQueries({ queryKey: ['santa-rooms'] })
    },
  })
}

export const useApiDeleteSantaRoom = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError>({
    mutationFn: () => api.delete(`santa/rooms/${seg(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-rooms'] }),
  })
}

export const useApiRemoveSantaParticipant = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError, string>({
    mutationFn: participantId => api.delete(`santa/rooms/${seg(roomId)}/participants/${seg(participantId)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-room', roomId] }),
  })
}

const useRoomAction = (roomId: string, action: 'draw' | 'redraw') => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError>({
    mutationFn: () => api.post(`santa/rooms/${seg(roomId)}/${action}`),
    onSettled: async () => {
      // И при 409: комнату могли разыграть в другой вкладке — показать как есть.
      await queryClient.invalidateQueries({ queryKey: ['santa-room', roomId] })
      await queryClient.invalidateQueries({ queryKey: ['santa-rooms'] })
    },
  })
}

export const useApiSantaDraw = (roomId: string) => useRoomAction(roomId, 'draw')
export const useApiSantaRedraw = (roomId: string) => useRoomAction(roomId, 'redraw')

export const useApiSantaRemind = (roomId: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaRemindResult>, AxiosError>({
    mutationFn: () => api.post(`santa/rooms/${seg(roomId)}/remind`),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['santa-room', roomId] }),
  })
}

// ── Участник ───────────────────────────────────────────────────────

export const useApiSantaInvite = (slug: string) =>
  useQuery({
    queryKey: ['santa-invite', slug],
    enabled: isValidSantaSlug(slug),
    queryFn: () => api.get<Data<SantaInvite>>(`santa/r/${seg(slug)}`),
    retry: false,
  })

/** null — этот браузер (и аккаунт) в комнате не состоит: показать вступление. */
export const useApiSantaMe = (slug: string, enabled: boolean) =>
  useQuery({
    queryKey: ['santa-me', slug],
    enabled: enabled && isValidSantaSlug(slug),
    retry: false,
    // Ждём жеребьёвку по расписанию; после неё — свежие счётчики чата.
    refetchInterval: query => {
      const me = query.state.data?.data
      return me && (me.room.status === 'drawn' || me.room.drawAt) ? ROOM_POLL_MS : false
    },
    queryFn: async () => {
      try {
        return await api.get<Data<SantaMe>>(`santa/r/${seg(slug)}/me`, { headers: santaHeaders(slug) })
      } catch (err) {
        // Устаревший токен (участника убрали, комнату удалили) — не ошибка,
        // а «вы не в комнате».
        if (isAxiosError(err) && err.response?.status === 404) return null
        throw err
      }
    },
  })

export const useApiSantaJoin = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaJoinResult>, AxiosError, SantaProfileInput>({
    mutationFn: body => api.post(`santa/r/${seg(slug)}/join`, body, { headers: santaHeaders(slug) }),
    onSuccess: res => {
      setSantaToken(slug, res.data.token)
      queryClient.setQueryData(['santa-me', slug], { data: res.data.me })
      return queryClient.invalidateQueries({ queryKey: ['santa-invite', slug] })
    },
  })
}

export const useApiSantaUpdateMe = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaMe>, AxiosError, SantaProfileInput>({
    mutationFn: body => api.patch(`santa/r/${seg(slug)}/me`, body, { headers: santaHeaders(slug) }),
    onSuccess: res => queryClient.setQueryData(['santa-me', slug], res),
  })
}

export const useApiSantaLeave = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError>({
    mutationFn: () => api.delete(`santa/r/${seg(slug)}/me`, { headers: santaHeaders(slug) }),
    onSuccess: () => {
      clearSantaToken(slug)
      queryClient.setQueryData(['santa-me', slug], null)
      return queryClient.invalidateQueries({ queryKey: ['santa-invite', slug] })
    },
  })
}

export const useApiSantaRequestEmailCode = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<boolean>, AxiosError, string>({
    mutationFn: email => api.post(`santa/r/${seg(slug)}/me/email`, { email }, { headers: santaHeaders(slug) }),
    // emailPending и новый адрес — из карточки участника.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['santa-me', slug] }),
  })
}

export const useApiSantaVerifyEmail = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaMe>, AxiosError, string>({
    mutationFn: code => api.post(`santa/r/${seg(slug)}/me/email/verify`, { code }, { headers: santaHeaders(slug) }),
    onSuccess: res => queryClient.setQueryData(['santa-me', slug], res),
  })
}

export const useApiSantaTelegramLink = (slug: string) =>
  useMutation<Data<{ url: string }>, AxiosError>({
    mutationFn: () => api.post(`santa/r/${seg(slug)}/me/telegram`, undefined, { headers: santaHeaders(slug) }),
  })

export const useApiSantaChat = (slug: string, withWho: SantaChatWith) => {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['santa-chat', slug, withWho],
    enabled: isValidSantaSlug(slug),
    retry: false,
    refetchInterval: CHAT_POLL_MS,
    queryFn: async () => {
      const res = await api.get<Data<SantaChat>>(`santa/r/${seg(slug)}/me/chat`, {
        headers: santaHeaders(slug),
        params: { with: withWho },
      })
      // Бэк отметил входящие прочитанными — обнуляем счётчик вкладки без лишнего запроса.
      queryClient.setQueryData<Data<SantaMe> | null>(['santa-me', slug], old => (old ? { data: withChatRead(old.data, withWho) } : old))
      return res
    },
  })
}

export const useApiSantaSendChat = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaChatMessage>, AxiosError, { with: SantaChatWith; body: string }>({
    mutationFn: body => api.post(`santa/r/${seg(slug)}/me/chat`, body, { headers: santaHeaders(slug) }),
    onSuccess: (res, vars) => queryClient.setQueryData<Data<SantaChat>>(['santa-chat', slug, vars.with], old =>
      old ? { data: { ...old.data, messages: [...old.data.messages, res.data] } } : old),
  })
}

export const useApiSantaGiftReady = (slug: string) => {
  const queryClient = useQueryClient()
  return useMutation<Data<SantaMe>, AxiosError, boolean>({
    mutationFn: ready => api.put(`santa/r/${seg(slug)}/me/gift`, { ready }, { headers: santaHeaders(slug) }),
    onSuccess: res => queryClient.setQueryData(['santa-me', slug], res),
  })
}
