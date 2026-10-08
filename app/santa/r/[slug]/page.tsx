'use client'

import { useApiSantaInvite, useApiSantaMe } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { isValidSantaSlug } from '@/shared/santa'
import { setSantaToken } from '@/shared/santa-token'
import { useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { ChatCard } from './components/chat-card'
import { Envelope } from './components/envelope'
import { InviteHeader } from './components/invite-header'
import { JoinForm } from './components/join-form'
import { MyCard } from './components/my-card'
import { NotifyCard } from './components/notify-card'

const TOKEN_RE = /^[A-Za-z0-9_-]{20,100}$/

function InvitePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const rawToken = useSearchParams().get('t')
  const urlToken = rawToken?.trim() ?? null
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Личная ссылка ?t=… — токен в хранилище, из адресной строки прочь:
    // иначе он уедет в историю браузера и в скриншоты.
    if (rawToken !== null) {
      // Токен бэкенда — 32 случайных байта в base64url; остальное игнорируем.
      if (urlToken && TOKEN_RE.test(urlToken) && isValidSantaSlug(slug)) {
        setSantaToken(slug, urlToken)
        // Токен не входит в ключ запроса: закешированное «не участник» (null)
        // от прошлого визита иначе показало бы форму вступления настоящему участнику.
        // reset — сброс кеша и перезапрос, без мелькания старого значения.
        void queryClient.resetQueries({ queryKey: ['santa-me', slug] })
      }
      // Из адресной строки прочь: иначе токен уедет в историю браузера и в скриншоты.
      const params = new URLSearchParams(window.location.search)
      params.delete('t')
      const qs = params.toString()
      router.replace(pathname + (qs ? `?${qs}` : '') + window.location.hash)
    }
    setReady(true)
  }, [rawToken, urlToken, slug, pathname, router, queryClient])

  const invite = useApiSantaInvite(slug)
  const me = useApiSantaMe(slug, ready)

  const notFound = !isValidSantaSlug(slug) || (isAxiosError(invite.error) && invite.error.response?.status === 404)
  if (notFound) {
    return <p className="text-body text-muted-foreground">Комната не найдена. Проверьте ссылку у организатора.</p>
  }
  if (invite.isError) {
    return (
      <div className="space-y-4">
        <p className="text-body text-muted-foreground">Не удалось загрузить приглашение</p>
        <Button variant="secondary" onClick={() => invite.refetch()}>Повторить</Button>
      </div>
    )
  }
  if (!invite.data || !ready || me.isPending) {
    return <p className="text-body text-muted-foreground">Загружаем приглашение…</p>
  }

  if (me.isError) {
    // Не 404 (404 — это null): участие неизвестно, вступление не показываем,
    // иначе участник по токену создал бы себе двойника.
    return (
      <div className="space-y-4">
        <p className="text-body text-muted-foreground">Не удалось загрузить ваше участие</p>
        <Button variant="secondary" onClick={() => me.refetch()}>Повторить</Button>
      </div>
    )
  }

  const room = invite.data.data
  // null (404 по токену/аккаунту, в том числе устаревший токен) — «не участник».
  const mine = me.data?.data ?? null

  if (mine && mine.room.status === 'drawn') {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <Envelope slug={slug} room={mine.room} receiver={mine.receiver} ready={mine.notify.ready}>
          {mine.receiver && <ChatCard slug={slug} receiverName={mine.receiver.name} unread={mine.chat} />}
        </Envelope>
        <NotifyCard slug={slug} notify={mine.notify} drawn inDraw={mine.receiver !== null} />
        <MyCard slug={slug} me={mine} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <InviteHeader invite={room} />
      {mine && <NotifyCard slug={slug} notify={mine.notify} drawn={false} />}
      {mine && <MyCard slug={slug} me={mine} />}
      {!mine && room.status === 'open' && <JoinForm slug={slug} />}
      {!mine && room.status === 'drawn' && (
        <p className="text-body text-muted-foreground">
          Жеребьёвка уже прошла — вступить нельзя. Если вы участник, откройте свою личную ссылку
          или войдите в аккаунт, с которым вступали.
        </p>
      )}
    </div>
  )
}

export default function SantaInvitePage() {
  // useSearchParams требует границу Suspense.
  return (
    <Suspense fallback={null}>
      <InvitePage />
    </Suspense>
  )
}
