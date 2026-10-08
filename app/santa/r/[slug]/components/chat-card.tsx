'use client'

import { useApiSantaChat, useApiSantaSendChat } from '@/api/santa'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Segmented } from '@/components/ui/segmented'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { type ChatValues, apiErrorMessage, chatSchema, chatTabLabel, formatTime } from '@/shared/santa'
import type { SantaChatUnread, SantaChatWith } from '@/shared/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { MessagesSquare } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

export function ChatCard({ slug, receiverName, unread }: { slug: string; receiverName: string; unread: SantaChatUnread | null }) {
  const [withWho, setWithWho] = useState<SantaChatWith>('receiver')
  const chat = useApiSantaChat(slug, withWho)
  const send = useApiSantaSendChat(slug)
  const form = useForm<ChatValues>({ resolver: zodResolver(chatSchema), defaultValues: { body: '' } })
  const listRef = useRef<HTMLOListElement>(null)
  const messages = chat.data?.data.messages ?? []

  // Новое сообщение или другая вкладка — к последнему.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, withWho])

  const submit = form.handleSubmit(v => send.mutate({ with: withWho, body: v.body.trim() }, {
    onSuccess: () => form.reset({ body: '' }),
    onError: err => toast({ variant: 'destructive', title: apiErrorMessage(err) }),
  }))

  const options = [
    ['receiver', chatTabLabel('receiver', unread)],
    ['santa', chatTabLabel('santa', unread)],
  ] as const
  const other = withWho === 'receiver' ? receiverName : 'Санта'

  return (
    <section id="chat" className="space-y-5 rounded-card border border-border bg-card p-6" aria-labelledby="chat-title">
      <div className="flex items-center gap-2.5">
        <MessagesSquare className="size-5 text-tone-pink" aria-hidden />
        <h2 id="chat-title" className="text-title-sm">Анонимный чат</h2>
      </div>
      <Segmented value={withWho} options={options} onChange={setWithWho} label="С кем переписка" />
      <p className="text-body-sm text-muted-foreground">
        {withWho === 'receiver'
          ? `${receiverName} не узнает, кто вы. Спросите про размер, любимый цвет или что точно не дарить.`
          : 'Ваш Санта знает ваше имя, а вы его — нет. Подскажите, что порадует.'}
      </p>

      {chat.isError ? (
        <div className="space-y-3">
          <p className="text-body-sm text-muted-foreground">Не удалось загрузить переписку</p>
          <Button variant="secondary" onClick={() => chat.refetch()}>Повторить</Button>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{chat.isPending ? 'Загружаем переписку…' : 'Сообщений пока нет.'}</p>
      ) : (
        <ol ref={listRef} className="max-h-96 space-y-3 overflow-y-auto" aria-label="Сообщения" aria-live="polite">
          {messages.map(m => (
            <li key={m.id} className={cn('flex flex-col gap-1', m.mine ? 'items-end' : 'items-start')}>
              <p
                className={cn(
                  'max-w-sm whitespace-pre-line break-words rounded-control px-3.5 py-2.5 text-body',
                  m.mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
                )}
              >
                {m.body}
              </p>
              <span className="text-caption text-muted-foreground">
                {m.mine ? 'вы' : other} · {formatTime(new Date(m.createdAt))}
              </span>
            </li>
          ))}
        </ol>
      )}

      <Form {...form}>
        <form className="space-y-3" onSubmit={submit}>
          <FormField control={form.control} name="body" render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">Сообщение</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  maxLength={1000}
                  placeholder={withWho === 'receiver' ? `Сообщение для: ${receiverName}` : 'Сообщение своему Санте'}
                  {...field}
                  onKeyDown={e => {
                    // Ctrl/⌘+Enter — отправить; просто Enter — новая строка.
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      void submit()
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="festive" loading={send.isPending}>Отправить</Button>
            <p className="text-caption text-muted-foreground">В Telegram можно ответить прямо на сообщение бота.</p>
          </div>
        </form>
      </Form>
    </section>
  )
}
