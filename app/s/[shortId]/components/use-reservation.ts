'use client'

import { useApiReleasePresent, useApiReservePresent } from '@/api/present'
import { toast } from '@/hooks/use-toast'
import { Present } from '@/shared/types'
import { AxiosError } from 'axios'

/** Состояние карточки подарка глазами текущего гостя. */
export type ReservationState = 'free' | 'mine' | 'taken'

/**
 * Бронь и её отмена одним хуком.
 *
 * Логика одинакова для карточек и для списка, а раньше жила в двух местах
 * и успела разойтись: в списке не было обработки ошибок вовсе.
 */
export function useReservation(present: Present, wishlistId: string) {
  const reserve = useApiReservePresent(wishlistId)
  const release = useApiReleasePresent(wishlistId)

  const state: ReservationState =
    present.reservedByMe ? 'mine' : present.reserved ? 'taken' : 'free'

  /** Текст ошибки от бэка: «подарок уже забронировали» лучше общей фразы. */
  const showError = (error: AxiosError) => {
    const message = (error.response?.data as { error?: string } | undefined)?.error
    toast({
      title: message ?? 'Не получилось — попробуйте ещё раз',
      variant: 'destructive',
    })
  }

  return {
    state,
    isPending: reserve.isPending || release.isPending,

    reserve: () =>
      reserve.mutate({ presentId: present.id }, {
        onSuccess: () => toast({ title: 'Подарок забронирован!', variant: 'success' }),
        onError: showError,
      }),

    release: () =>
      release.mutate({ presentId: present.id }, {
        onSuccess: () => toast({ title: 'Бронь снята' }),
        onError: showError,
      }),
  }
}
