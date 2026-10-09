'use client'

import { useApiSantaRequestEmailCode, useApiSantaTelegramLink, useApiSantaVerifyEmail } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'
import { type CodeValues, type EmailValues, apiErrorMessage, channelLabel, codeSchema, emailSchema, telegramActive } from '@/shared/santa'
import type { SantaNotifyView } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { BellRing, Mail, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

const RESEND_SECONDS = 60
const TG_POLL_MS = 4000
const TG_POLL_LIMIT_MS = 3 * 60 * 1000

export function NotifyCard({ slug, notify, drawn, inDraw = true }: { slug: string; notify: SantaNotifyView; drawn: boolean; inDraw?: boolean }) {
  const [editing, setEditing] = useState(false)
  const showChooser = !notify.ready || editing

  return (
    <section className="space-y-5 rounded-card border border-border bg-card p-6" aria-labelledby="notify-title">
      <div className="flex items-center gap-2.5">
        <BellRing className="size-5 text-tone-gold" aria-hidden />
        <h2 id="notify-title" className="text-title-sm">Куда прислать результат</h2>
      </div>

      {notify.ready && !editing && (
        <div className="space-y-3">
          <p className="text-body">
            {drawn && !inDraw
              ? 'Канал подключён: '
              : drawn ? 'Новости о подопечном придут ' : 'Имя подопечного придёт '}
            <span className="font-semibold">{channelLabel(notify)}</span>.
            {drawn && !inDraw && ' Чтобы попасть в пары, попросите организатора перезапустить жеребьёвку.'}
          </p>
          {notify.emailPending && (
            <p className="text-body-sm text-muted-foreground">
              Новый адрес {notify.pendingEmail} ждёт кода из письма — до подтверждения пишем по-старому.
            </p>
          )}
          <Button variant="ghost" onClick={() => setEditing(true)}>{notify.emailPending ? 'Ввести код' : 'Сменить'}</Button>
        </div>
      )}

      {showChooser && (
        <>
          {notify.ready && (
            <p className="text-body-sm text-muted-foreground">
              Пока новый канал не подтверждён, сообщения приходят {channelLabel(notify)}.
            </p>
          )}
          {!notify.ready && (
            <p className="text-body-sm text-muted-foreground">
              {drawn && !inDraw
                ? 'Подключите почту или Telegram и попросите организатора перезапустить жеребьёвку — иначе вы не попадёте в пары.'
                : drawn
                ? 'Подключите почту или Telegram — пришлём, если подопечный поменяет пожелания.'
                : 'Без подтверждённой почты или Telegram вы не попадёте в жеребьёвку: так мы точно сообщим вам имя подопечного.'}
            </p>
          )}
          <TelegramConnect slug={slug} connected={telegramActive(notify)} />
          <div className="flex items-center gap-3 text-caption text-muted-foreground" aria-hidden>
            <span className="h-px flex-1 bg-border" />или<span className="h-px flex-1 bg-border" />
          </div>
          <EmailConnect slug={slug} notify={notify} onDone={() => setEditing(false)} />
          {editing && <Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>}
        </>
      )}
    </section>
  )
}

function TelegramConnect({ slug, connected }: { slug: string; connected: boolean }) {
  const queryClient = useQueryClient()
  const link = useApiSantaTelegramLink(slug)
  const url = link.data?.data.url ?? null

  // Пока человек в Telegram жмёт «Старт», переспрашиваем карточку: бот отметит канал.
  useEffect(() => {
    if (!url || connected) return
    const started = Date.now()
    const id = window.setInterval(() => {
      if (Date.now() - started > TG_POLL_LIMIT_MS) {
        window.clearInterval(id)
        return
      }
      void queryClient.invalidateQueries({ queryKey: ['santa-me', slug] })
    }, TG_POLL_MS)
    return () => window.clearInterval(id)
  }, [url, connected, slug, queryClient])

  if (connected) {
    return <p className="text-body-sm">Telegram подключён.</p>
  }
  if (url) {
    return (
      <div className="space-y-2">
        <Button asChild variant="festive" size="lg" className="w-full">
          <a href={url} target="_blank" rel="noopener noreferrer"><Send aria-hidden />Открыть бота в Telegram</a>
        </Button>
        <p className="text-caption text-muted-foreground">
          Нажмите в боте «Старт» — эта страница сама заметит подключение. Ссылка одноразовая и действует сутки.
        </p>
      </div>
    )
  }
  return (
    <Button
      variant="secondary" size="lg" className="w-full" loading={link.isPending}
      onClick={() => link.mutate(undefined, { onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }) })}
    >
      <Send aria-hidden />Подключить Telegram
    </Button>
  )
}

function EmailConnect({ slug, notify, onDone }: { slug: string; notify: SantaNotifyView; onDone: () => void }) {
  const request = useApiSantaRequestEmailCode(slug)
  const verify = useApiSantaVerifyEmail(slug)
  const [sentTo, setSentTo] = useState<string | null>(notify.emailPending ? notify.pendingEmail : null)
  const [cooldown, setCooldown] = useState(0)

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: notify.pendingEmail || notify.email },
  })
  const codeForm = useForm<CodeValues>({ resolver: zodResolver(codeSchema), defaultValues: { code: '' } })

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown(s => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const onError = (err: unknown) => toast({ variant: 'destructive', title: apiErrorMessage(err) })

  const send = (email: string) =>
    request.mutate(email, {
      onSuccess: () => {
        setSentTo(email)
        setCooldown(RESEND_SECONDS)
        codeForm.reset({ code: '' })
      },
      onError,
    })

  if (sentTo) {
    return (
      <Form {...codeForm}>
        {/* Разные key у форм почты и кода: иначе React переиспользует поле, а useController
            оставит обработчики прежней формы — ввод уйдёт в форму почты, а инпут кода замрёт. */}
        <form
          key="code"
          className="space-y-4"
          onSubmit={codeForm.handleSubmit(v => verify.mutate(v.code, {
            onSuccess: () => {
              toast({ title: 'Почта подтверждена' })
              setSentTo(null)
              onDone()
            },
            onError,
          }))}
        >
          <FormField control={codeForm.control} name="code" render={({ field }) => (
            <FormItem>
              <FormLabel>Код из письма на {sentTo}</FormLabel>
              <FormControl>
                <Input inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" disabled={verify.isPending} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="festive" loading={verify.isPending}>Подтвердить</Button>
            <Button type="button" variant="ghost" disabled={cooldown > 0} loading={request.isPending} onClick={() => send(sentTo)}>
              {cooldown > 0 ? `Ещё раз через ${cooldown} с` : 'Прислать код ещё раз'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { codeForm.reset({ code: '' }); setSentTo(null) }}>Другой адрес</Button>
          </div>
          <p className="text-caption text-muted-foreground">Код действует 15 минут. Не пришло — проверьте «Спам».</p>
        </form>
      </Form>
    )
  }

  return (
    <Form {...emailForm}>
      <form key="email" className="space-y-4" onSubmit={emailForm.handleSubmit(v => send(v.email.trim().toLowerCase()))}>
        <FormField control={emailForm.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Почта</FormLabel>
            <FormControl><Input type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" variant="secondary" size="lg" className="w-full" loading={request.isPending}>
          <Mail aria-hidden />Прислать код
        </Button>
      </form>
    </Form>
  )
}
