'use client'

import { useApiSantaLeave, useApiSantaUpdateMe } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { apiErrorMessage } from '@/shared/santa'
import { SANTA_ORIGIN, santaHref } from '@/shared/santa-route'
import { getSantaToken } from '@/shared/santa-token'
import type { SantaMe } from '@/shared/types'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { ConfirmAction } from '../../../components/confirm-action'
import { CopyField } from '../../../components/copy-field'
import { ProfileForm } from './profile-form'
import { useMyWishlistOptions } from './wishlist-picker'

export function MyCard({ slug, me }: { slug: string; me: SantaMe }) {
  const queryClient = useQueryClient()
  const update = useApiSantaUpdateMe(slug)
  const leave = useApiSantaLeave(slug)
  const drawn = me.room.status === 'drawn'
  const [personalLink, setPersonalLink] = useState<string | null>(null)
  const wishlists = useMyWishlistOptions()

  useEffect(() => {
    // Ссылка только у вошедших по токену; по аккаунту и так узнаем.
    const token = getSantaToken(slug)
    if (!token) {
      setPersonalLink(null)
      return
    }
    // На проде — адрес поддомена; в разработке — текущий адрес после монтирования.
    const origin = SANTA_ORIGIN || window.location.origin
    setPersonalLink(`${origin}${santaHref(`/r/${slug}`)}?t=${encodeURIComponent(token)}`)
  }, [slug])

  const onError = (err: unknown) => {
    toast({ variant: 'destructive', title: apiErrorMessage(err) })
  }
  // 409 после жеребьёвки в другой вкладке — перечитать состояние, чтобы показать конверт.
  const onUpdateError = (err: unknown) => {
    onError(err)
    void queryClient.invalidateQueries({ queryKey: ['santa-me', slug] })
  }

  return (
    <section className="space-y-6 rounded-card border border-border bg-card p-6">
      <div>
        <h2 className="text-title-sm">{drawn ? 'Ваши пожелания' : 'Вы в комнате'}</h2>
        {!drawn && (
          <p className="mt-1 text-body-sm text-muted-foreground">
            Когда организатор проведёт жеребьёвку, здесь появится конверт с именем вашего подопечного.
          </p>
        )}
      </div>
      {personalLink && (
        <div className="space-y-2">
          <CopyField label="Ваша личная ссылка" value={personalLink} />
          <p className="text-caption text-muted-foreground">
            Сохраните её: по ней вы вернётесь с другого устройства. Ссылка личная — никому её не отправляйте.
          </p>
        </div>
      )}
      <ProfileForm
        key={wishlists.length}
        wishlists={wishlists}
        defaultValues={{ name: me.name, wishes: me.wishes, wishlistUrl: me.wishlistUrl }}
        nameLocked={drawn}
        submitLabel="Сохранить"
        pending={update.isPending}
        onSubmit={values => update.mutate(values, { onSuccess: () => toast({ title: 'Сохранено' }), onError: onUpdateError })}
      />
      {!drawn && (
        <ConfirmAction
          trigger={<Button variant="ghost" className="text-destructive" loading={leave.isPending}>Выйти из комнаты</Button>}
          title="Выйти из комнаты?"
          description="Ваши имя и пожелания удалятся. Вернуться можно по приглашению, пока не прошла жеребьёвка."
          confirmLabel="Выйти"
          onConfirm={() => leave.mutate(undefined, { onError })}
        />
      )}
    </section>
  )
}
