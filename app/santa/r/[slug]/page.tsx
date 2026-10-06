'use client'

import { useApiSantaInvite, useApiSantaMe } from '@/api/santa'
import { setSantaToken } from '@/shared/santa-token'
import { useQueryClient } from '@tanstack/react-query'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Envelope } from './components/envelope'
import { InviteHeader } from './components/invite-header'
import { JoinForm } from './components/join-form'
import { MyCard } from './components/my-card'

function InvitePage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const urlToken = useSearchParams().get('t')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Личная ссылка ?t=… — токен в хранилище, из адресной строки прочь:
    // иначе он уедет в историю браузера и в скриншоты.
    if (urlToken) {
      setSantaToken(slug, urlToken)
      // Токен не входит в ключ запроса: закешированное «не участник» (null)
      // от прошлого визита иначе показало бы форму вступления настоящему участнику.
      // reset — сброс кеша и перезапрос, без мелькания старого значения.
      void queryClient.resetQueries({ queryKey: ['santa-me', slug] })
      router.replace(pathname)
    }
    setReady(true)
  }, [urlToken, slug, pathname, router, queryClient])

  const invite = useApiSantaInvite(slug)
  const me = useApiSantaMe(slug, ready)

  if (invite.isError) {
    return <p className="text-body text-muted-foreground">Комната не найдена. Проверьте ссылку у организатора.</p>
  }
  if (!invite.data || !ready || me.isPending) {
    return <p className="text-body text-muted-foreground">Загружаем приглашение…</p>
  }

  const room = invite.data.data
  // null (404 по токену/аккаунту, в том числе устаревший токен) — «не участник».
  const mine = me.data?.data ?? null

  if (mine && mine.room.status === 'drawn') {
    return (
      <div className="mx-auto max-w-xl space-y-8">
        <Envelope slug={slug} room={mine.room} receiver={mine.receiver} />
        <MyCard slug={slug} me={mine} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <InviteHeader invite={room} />
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
