'use client'

import {
  useApiJoinGroupPresent,
  useApiLeaveGroupPresent,
  useApiReleasePresent,
  useApiReservePresent,
} from '@/api/present'
import { toast } from '@/hooks/use-toast'
import { Present } from '@/shared/types'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'

/** Состояние карточки подарка глазами текущего гостя. */
export type ReservationState = 'free' | 'mine' | 'taken'

/** Текст ошибки от бэка: «подарок уже забронировали» лучше общей фразы. */
function showError(error: AxiosError) {
  const message = (error.response?.data as { error?: string } | undefined)?.error
  toast({
    title: message ?? 'Не получилось — попробуйте ещё раз',
    variant: 'destructive',
  })
}

/**
 * Бронь и её отмена одним хуком.
 *
 * Логика одинакова для карточек и для списка, а раньше жила в двух местах
 * и успела разойтись: в списке не было обработки ошибок вовсе.
 *
 * isExample — витрина готовых вишлистов: там нет ни настоящего вишлиста, ни
 * гостя, поэтому бронь живёт только в состоянии компонента.
 */
export function useReservation(present: Present, wishlistId: string, isExample = false) {
  const reserve = useApiReservePresent(wishlistId)
  const release = useApiReleasePresent(wishlistId)
  const [exampleState, setExampleState] = useState<ReservationState>(
    present.reserved ? 'taken' : 'free',
  )

  const state: ReservationState = isExample
    ? exampleState
    : present.reservedByMe ? 'mine' : present.reserved ? 'taken' : 'free'

  return {
    state,
    isPending: reserve.isPending || release.isPending,

    reserve: () => {
      if (isExample) {
        setExampleState('mine')
        toast({ title: 'Подарок забронирован!', variant: 'success' })
        return
      }
      reserve.mutate({ presentId: present.id }, {
        onSuccess: () => toast({ title: 'Подарок забронирован!', variant: 'success' }),
        onError: showError,
      })
    },

    release: () => {
      if (isExample) {
        setExampleState('free')
        return
      }
      release.mutate({ presentId: present.id }, {
        onSuccess: () => toast({ title: 'Бронь снята' }),
        onError: showError,
      })
    },
  }
}

/**
 * Групповой подарок: сколько человек скинулось и участвует ли этот гость.
 *
 * Счётчик на бэке общий и не привязан к гостю, поэтому «я уже отметился»
 * помним в localStorage этого браузера — иначе кнопка предлагала бы
 * записаться второй раз.
 */
export function useGroupJoin(present: Present, wishlistId: string, isExample = false) {
  const join = useApiJoinGroupPresent(wishlistId)
  const leave = useApiLeaveGroupPresent(wishlistId)
  const [joined, setJoined] = useState(false)
  const [exampleCount, setExampleCount] = useState(present.participantsCount ?? 0)

  const storageKey = `gift-joined-${present.id}`

  useEffect(() => {
    try {
      setJoined(localStorage.getItem(storageKey) === '1')
    } catch {
      // приватный режим или запрещённые куки — считаем, что гость не отмечался
    }
  }, [storageKey])

  const remember = (value: boolean) => {
    try {
      if (value) localStorage.setItem(storageKey, '1')
      else localStorage.removeItem(storageKey)
    } catch {
      // не смогли запомнить — кнопка просто предложит отметиться снова
    }
    setJoined(value)
  }

  const toggle = () => {
    if (isExample) {
      setExampleCount(count => count + (joined ? -1 : 1))
      if (!joined) toast({ title: 'Вы отметили, что хотите подарить!', variant: 'success' })
      setJoined(!joined)
      return
    }
    if (joined) {
      leave.mutate({ presentId: present.id }, {
        onSuccess: () => remember(false),
        onError: showError,
      })
      return
    }
    join.mutate({ presentId: present.id }, {
      onSuccess: () => {
        remember(true)
        toast({ title: 'Вы отметили, что хотите подарить!', variant: 'success' })
      },
      onError: showError,
    })
  }

  return {
    joined,
    count: isExample ? exampleCount : present.participantsCount ?? 0,
    isPending: join.isPending || leave.isPending,
    toggle,
  }
}
