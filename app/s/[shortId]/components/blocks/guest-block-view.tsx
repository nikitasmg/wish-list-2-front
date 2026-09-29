'use client'
import { useState } from 'react'
import { useGuestData } from '@/api/guestdata'
import api from '@/lib/api'
import { Block, GuestbookEntry, PlaylistTrack, PollResults, RSVPResponse, RSVPSummary } from '@/shared/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

type Props = { block: Block; wishlistId: string; owner?: boolean }
function ErrorText({ error }: { error: unknown }) { return error ? <p role="alert" className="text-sm text-destructive">Не удалось выполнить запрос. Попробуйте ещё раз.</p> : null }
export function GuestBlockView(props: Props) {
  switch (props.block.type) {
    case 'rsvp': return props.owner ? <RSVPSummaryView {...props} /> : <RSVPView {...props} />
    case 'poll': return <PollView {...props} />
    case 'playlist': return <PlaylistView {...props} />
    case 'guestbook': return <GuestbookView {...props} />
    default: return null
  }
}
function RSVPView({ block, wishlistId }: Props) {
  const query = useGuestData<RSVPResponse | null>(wishlistId, block.id, 'rsvp')
  const [going, setGoing] = useState<boolean | null>(null)
  const current = going ?? query.result?.going ?? true
  const fields = (block.data.fields ?? []) as string[]
  return <form key={query.result?.updatedAt ?? 'new'} className="space-y-3 rounded-2xl border bg-card p-5" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); query.mutation.mutate({ name: f.get('name'), going: current, plusOne: current ? Number(f.get('plusOne') ?? 0) : 0, kids: current ? Number(f.get('kids') ?? 0) : 0, menu: current ? String(f.get('menu') ?? '') : '', transfer: current && f.get('transfer') === 'on', comment: f.get('comment') }, { onSuccess: () => toast({ title: 'Ответ сохранён' }) }) }}>
    <h3 className="text-xl font-bold">Вы придёте?</h3>
    <div className="flex gap-2">{[true, false].map(value => <Button type="button" key={String(value)} variant={current === value ? 'default' : 'outline'} aria-pressed={current === value} onClick={() => setGoing(value)}>{value ? 'Приду' : 'Не смогу'}</Button>)}</div>
    <label className="block text-sm space-y-1"><span>Ваше имя</span><Input name="name" required maxLength={60} defaultValue={query.result?.name} /></label>
    {current && <>{fields.includes('plusOne') && <label className="block text-sm">Со мной ещё<Input name="plusOne" type="number" min={0} max={10} defaultValue={query.result?.plusOne ?? 0} /></label>}{fields.includes('kids') && <label className="block text-sm">Детей<Input name="kids" type="number" min={0} max={10} defaultValue={query.result?.kids ?? 0} /></label>}{fields.includes('menu') && <label className="block text-sm">Ограничения в еде<Input name="menu" maxLength={120} defaultValue={query.result?.menu} /></label>}{fields.includes('transfer') && <label className="flex gap-2 text-sm"><input type="checkbox" name="transfer" defaultChecked={query.result?.transfer} />Нужен трансфер</label>}</>}
    <Textarea name="comment" aria-label="Комментарий" placeholder="Комментарий" maxLength={300} defaultValue={query.result?.comment} />
    <ErrorText error={query.error || query.mutation.error} /><Button disabled={query.isLoading || query.mutation.isPending}>{query.result ? 'Изменить ответ' : 'Отправить ответ'}</Button>
  </form>
}
function RSVPSummaryView({ wishlistId, block }: Props) {
  const q = useGuestData<RSVPSummary>(wishlistId, block.id, 'rsvp', true)
  return <div className="space-y-4"><ErrorText error={q.error} /><p className="text-lg font-bold">Придут: {q.result?.totalPeople ?? 0} · Не смогут: {q.result?.notGoing ?? 0}</p><p className="text-sm text-muted-foreground">Дети: {q.result?.kids ?? 0} · Трансфер: {q.result?.transfer ?? 0}</p>{q.result?.responses?.map(r => <article key={r.id} className="rounded-xl border p-4"><p className="font-semibold">{r.name} — {r.going ? 'Приду' : 'Не смогу'}</p><p className="text-sm">Спутники: {r.plusOne}, дети: {r.kids}{r.transfer && ', нужен трансфер'}</p><p className="text-sm whitespace-pre-wrap">{r.menu} {r.comment}</p></article>)}</div>
}
function PollView({ block, wishlistId }: Props) {
  const q = useGuestData<PollResults>(wishlistId, block.id, 'poll')
  const options = (block.data.options ?? []) as string[]
  return <div className="space-y-3"><h3 className="text-xl font-semibold">{String(block.data.question ?? 'Как думаете?')}</h3>{options.map((name, i) => { const percent = q.result?.total ? Math.round((q.result.votes?.[i] ?? 0) * 100 / q.result.total) : 0; return <button type="button" key={i} disabled={q.isLoading || Boolean(q.error) || q.mutation.isPending || q.result?.myVote != null} onClick={() => q.mutation.mutate({ option: i })} className={cn('relative flex w-full overflow-hidden rounded-xl border p-4 text-left', q.result?.myVote === i && 'border-primary')}><span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${percent}%` }} /><span className="relative flex-1">{name}</span><span className="relative">{percent}%</span></button> })}<p className="text-sm text-muted-foreground">Голосов: {q.result?.total ?? 0}</p><ErrorText error={q.error || q.mutation.error} /></div>
}
function PlaylistView({ block, wishlistId, owner }: Props) {
  const q = useGuestData<PlaylistTrack[]>(wishlistId, block.id, 'playlist')
  const [pending, setPending] = useState(false)
  return <div className="space-y-4">{q.result?.map(track => <div key={track.id} className="flex items-center justify-between gap-3 border-b py-3"><span>{track.title}</span>{block.data.votes !== false && <Button variant={track.votedByMe ? 'default' : 'outline'} aria-label={`Голос за ${track.title}`} disabled={pending} onClick={async () => { setPending(true); try { await api.put(`wishlists/${wishlistId}/playlist/${track.id}/vote`, {}); await q.refresh() } catch { toast({ title: 'Не удалось сохранить голос', variant: 'destructive' }) } finally { setPending(false) } }}>▲ {track.votes}</Button>}</div>)}
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); q.mutation.mutate({ title: f.get('title') }, { onSuccess: () => form.reset() }) }}><Input name="title" aria-label="Исполнитель и трек" placeholder="Исполнитель — название трека" required maxLength={120} className="flex-1 min-w-40" /><Button disabled={q.mutation.isPending}>Предложить трек</Button></form>
    {owner && <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText((q.result ?? []).map(t => `${t.title} (${t.votes})`).join('\n')); toast({ title: 'Список треков скопирован' }) } catch { toast({ title: 'Не удалось скопировать', variant: 'destructive' }) } }}>Выгрузить списком</Button>}<ErrorText error={q.error || q.mutation.error} />
  </div>
}
function GuestbookView({ block, wishlistId, owner }: Props) {
  const q = useGuestData<GuestbookEntry[]>(wishlistId, block.id, 'guestbook', owner)
  const [pending, setPending] = useState(false)
  return <div className="space-y-4">{q.result?.map(entry => <article key={entry.id} className={cn('rounded-xl border bg-card p-4 space-y-2', entry.hidden && 'opacity-50')}><p className="font-semibold">{entry.name}{entry.hidden && ' · скрыто'}</p><p className="whitespace-pre-wrap break-words">{entry.text}</p>{owner && <Button size="sm" variant="ghost" disabled={pending} onClick={async () => { setPending(true); try { await api.put(`wishlists/guestbook/${entry.id}/hidden`, { hidden: !entry.hidden }); await q.refresh() } catch { toast({ title: 'Не удалось изменить видимость', variant: 'destructive' }) } finally { setPending(false) } }}>{entry.hidden ? 'Показать' : 'Скрыть'}</Button>}</article>)}
    {!owner && <form className="space-y-3" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); q.mutation.mutate({ name: f.get('name'), text: f.get('text'), photoUrl: '' }, { onSuccess: () => form.reset() }) }}><Input name="name" aria-label="Ваше имя" placeholder="Ваше имя" maxLength={60} required /><Textarea name="text" aria-label="Поздравление" placeholder="Пара тёплых слов" maxLength={1000} required /><Button disabled={q.mutation.isPending}>Оставить поздравление</Button></form>}<ErrorText error={q.error || q.mutation.error} />
  </div>
}
