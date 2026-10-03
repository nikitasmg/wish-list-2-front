'use client'
import { useState } from 'react'
import { useGuestData } from '@/api/guestdata'
import api from '@/lib/api'
import { Block, GuestbookEntry, PlaylistTrack, PollResults, RSVPGuests, RSVPResponse, RSVPSummary } from '@/shared/types'
import { pollSettings, rsvpClosed, rsvpSettings, deadlineMoment } from '@/shared/block-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { isAxiosError } from 'axios'
import { Check, Minus, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

type Props = { block: Block; wishlistId: string; owner?: boolean }

function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  const status = isAxiosError(error) ? error.response?.status : undefined
  const message = status === 409 ? 'Приём ответов уже закрыт.' : status === 403 ? 'Организатор выключил эту возможность.' : 'Не удалось выполнить запрос. Попробуйте ещё раз.'
  return <p role="alert" className="text-sm text-destructive">{message}</p>
}

export function GuestBlockView(props: Props) {
  switch (props.block.type) {
    case 'rsvp': return props.owner ? <RSVPSummaryView {...props} /> : <RSVPView {...props} />
    case 'poll': return <PollView {...props} />
    case 'playlist': return <PlaylistView {...props} />
    case 'guestbook': return <GuestbookView {...props} />
    default: return null
  }
}

function Stepper({ label, value, onChange, max = 10 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <Button type="button" size="icon" variant="outline" className="h-9 w-9" aria-label={`${label}: меньше`} disabled={value <= 0} onClick={() => onChange(value - 1)}><Minus size={14} aria-hidden /></Button>
        <b className="w-8 text-center tabular-nums" aria-live="polite">{value}</b>
        <Button type="button" size="icon" variant="outline" className="h-9 w-9" aria-label={`${label}: больше`} disabled={value >= max} onClick={() => onChange(value + 1)}><Plus size={14} aria-hidden /></Button>
      </div>
    </div>
  )
}

function RSVPView({ block, wishlistId }: Props) {
  const query = useGuestData<RSVPResponse | null>(wishlistId, block.id, 'rsvp')
  const s = rsvpSettings(block.data)
  const saved = query.result
  const [going, setGoing] = useState<boolean | null>(null)
  const [plusOne, setPlusOne] = useState<number | null>(null)
  const [kids, setKids] = useState<number | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const current = going ?? saved?.going ?? true
  const closed = rsvpClosed(s)
  const deadline = deadlineMoment(s.deadline)
  const answer = (id: string) => answers[id] ?? saved?.answers?.[id] ?? ''
  const guests = useQuery({
    queryKey: ['guest-data', wishlistId, block.id, 'rsvp-guests'],
    queryFn: () => api.get<{ data: RSVPGuests }>(`wishlists/${wishlistId}/blocks/${encodeURIComponent(block.id)}/rsvp/guests`),
    enabled: s.showGuests,
    retry: false,
  })

  return <form
    key={saved?.updatedAt ?? 'new'}
    className="space-y-4"
    onSubmit={e => {
      e.preventDefault()
      // Кнопка, которой отправили форму, и есть ответ: «Придём» или «Не сможем».
      const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
      const current = submitter?.value ? submitter.value === 'yes' : going ?? saved?.going ?? true
      setGoing(current)
      const f = new FormData(e.currentTarget)
      const merged = Object.fromEntries(s.questions.map(q => [q.id, answer(q.id)]).filter(([, v]) => v !== ''))
      query.mutation.mutate({
        name: f.get('name'), going: current,
        plusOne: current ? plusOne ?? saved?.plusOne ?? 0 : 0,
        kids: current ? kids ?? saved?.kids ?? 0 : 0,
        menu: current ? String(f.get('menu') ?? '') : '',
        transfer: current && f.get('transfer') === 'on',
        comment: f.get('comment') ?? '',
        answers: current ? merged : {},
      }, { onSuccess: () => toast({ title: current ? 'Ждём вас!' : 'Жаль! Ответ сохранён' }) })
    }}
  >
    {deadline && <p className="text-sm text-muted-foreground">{closed ? 'Приём ответов закрыт' : `Ответьте до ${deadline.toLocaleDateString('ru', { day: 'numeric', month: 'long' })}`}</p>}
    <label className="block space-y-1 text-sm"><span>Как вас записать</span><Input name="name" required maxLength={60} defaultValue={saved?.name} placeholder="Имя и фамилия" disabled={closed} /></label>
    {current && <>
      {s.fields.includes('plusOne') && <Stepper label="Со мной ещё" value={plusOne ?? saved?.plusOne ?? 0} onChange={setPlusOne} />}
      {s.fields.includes('kids') && <Stepper label="Сколько детей" value={kids ?? saved?.kids ?? 0} onChange={setKids} />}
      {s.fields.includes('menu') && <label className="block space-y-1 text-sm"><span>Аллергии, ограничения в еде</span><Input name="menu" maxLength={120} defaultValue={saved?.menu} disabled={closed} /></label>}
      {s.fields.includes('transfer') && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="transfer" defaultChecked={saved?.transfer} disabled={closed} className="h-4 w-4 accent-[hsl(var(--primary))]" />Нужен трансфер</label>}
      {s.questions.map(q => q.kind === 'bool'
        ? <label key={q.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={answer(q.id) === 'true'} onChange={e => setAnswers({ ...answers, [q.id]: e.target.checked ? 'true' : 'false' })} disabled={closed} className="h-4 w-4 accent-[hsl(var(--primary))]" />{q.label}</label>
        : q.kind === 'number'
          ? <Stepper key={q.id} label={q.label} max={99} value={Number(answer(q.id) || 0)} onChange={v => setAnswers({ ...answers, [q.id]: String(v) })} />
          : <label key={q.id} className="block space-y-1 text-sm"><span>{q.label}</span><Input maxLength={300} value={answer(q.id)} onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} disabled={closed} /></label>)}
    </>}
    <Textarea name="comment" aria-label="Комментарий" placeholder="Комментарий — необязательно" maxLength={300} defaultValue={saved?.comment} disabled={closed} />
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map(value => (
        <Button
          key={String(value)}
          type="submit"
          value={value ? 'yes' : 'no'}
          variant={value ? 'default' : 'outline'}
          disabled={closed || query.isLoading || query.mutation.isPending}
        >
          {value ? 'Придём' : 'Не сможем'}
        </Button>
      ))}
    </div>
    {saved && <p className="text-sm text-muted-foreground">{saved.going ? 'Вы ответили, что придёте.' : 'Вы ответили, что не сможете.'} Ответ можно поменять.</p>}
    <ErrorText error={query.error || query.mutation.error} />
    {s.showGuests && guests.data?.data && guests.data.data.names.length > 0 && (
      <div className="space-y-1.5 border-t pt-4">
        <p className="text-sm font-semibold">Кто идёт · {guests.data.data.total}</p>
        <p className="text-sm text-muted-foreground">{guests.data.data.names.join(', ')}</p>
      </div>
    )}
  </form>
}

function RSVPSummaryView({ wishlistId, block }: Props) {
  const q = useGuestData<RSVPSummary>(wishlistId, block.id, 'rsvp', true)
  const questions = rsvpSettings(block.data).questions
  return <div className="space-y-4">
    <ErrorText error={q.error} />
    <p className="text-lg font-bold">Придут: {q.result?.totalPeople ?? 0} · Не смогут: {q.result?.notGoing ?? 0}</p>
    <p className="text-sm text-muted-foreground">Дети: {q.result?.kids ?? 0} · Трансфер: {q.result?.transfer ?? 0}</p>
    {q.result?.responses?.map(r => <article key={r.id} className="space-y-1 rounded-xl border p-4">
      <p className="font-semibold">{r.name} — {r.going ? 'придёт' : 'не сможет'}</p>
      {r.going && <p className="text-sm">Спутники: {r.plusOne}, дети: {r.kids}{r.transfer && ', нужен трансфер'}</p>}
      {questions.filter(qq => r.answers?.[qq.id]).map(qq => <p key={qq.id} className="text-sm"><span className="text-muted-foreground">{qq.label}:</span> {r.answers?.[qq.id] === 'true' ? 'да' : r.answers?.[qq.id] === 'false' ? 'нет' : r.answers?.[qq.id]}</p>)}
      {(r.menu || r.comment) && <p className="whitespace-pre-wrap text-sm">{[r.menu, r.comment].filter(Boolean).join(' · ')}</p>}
    </article>)}
  </div>
}

function PollView({ block, wishlistId, owner }: Props) {
  const q = useGuestData<PollResults>(wishlistId, block.id, 'poll')
  const s = pollSettings(block.data)
  const [picked, setPicked] = useState<string[] | null>(null)
  const [suggest, setSuggest] = useState('')
  const result = q.result
  const options = [...s.options, ...(result?.guestOptions ?? []).filter(o => !o.hidden).map(o => ({ id: o.id, text: o.text }))]
  const mine = result?.myVotes ?? []
  const chosen = picked ?? mine
  const voted = mine.length > 0
  const closed = Boolean(result?.closed)
  const showResults = Boolean(result && !result.hidden && (voted || closed || owner || s.results === 'all'))
  const busy = q.isLoading || q.mutation.isPending

  const submit = (ids: string[]) => q.mutation.mutate({ options: ids }, { onSuccess: () => setPicked(null) })
  const toggle = (id: string) => {
    if (!s.multiple) { submit([id]); return }
    setPicked(chosen.includes(id) ? chosen.filter(x => x !== id) : [...chosen, id])
  }

  return <div className="space-y-3">
    {s.question && <h3 className="heading text-xl font-bold">{s.question}</h3>}
    {s.multiple && !closed && <p className="text-sm text-muted-foreground">Можно выбрать несколько</p>}
    {options.map(option => {
      const count = result?.votes?.[option.id] ?? 0
      const percent = showResults && result?.total ? Math.round(count * 100 / result.total) : 0
      const active = chosen.includes(option.id)
      return <button
        type="button"
        key={option.id}
        aria-pressed={active}
        disabled={busy || closed || Boolean(q.error)}
        onClick={() => toggle(option.id)}
        className={cn('relative flex min-h-[48px] w-full items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-colors', active ? 'border-primary' : 'hover:border-primary/50')}
      >
        {showResults && <span className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${percent}%` }} aria-hidden />}
        <span className={cn('relative flex h-5 w-5 shrink-0 items-center justify-center border', s.multiple ? 'rounded-md' : 'rounded-full', active && 'border-primary bg-primary text-primary-foreground')} aria-hidden>
          {active && <Check size={12} />}
        </span>
        <span className="relative flex-1">{option.text}</span>
        {showResults && <span className="relative text-sm font-semibold tabular-nums">{percent}%</span>}
      </button>
    })}
    {s.multiple && !closed && picked && <Button disabled={busy || !picked.length} onClick={() => submit(picked)}>Проголосовать</Button>}
    {s.guestOptions && !closed && !owner && (
      <form className="flex gap-2" onSubmit={async e => {
        e.preventDefault()
        try {
          await api.post(`wishlists/${wishlistId}/blocks/${encodeURIComponent(block.id)}/poll/options`, { text: suggest })
          setSuggest('')
          await q.refresh()
        } catch { toast({ title: 'Не удалось добавить вариант', variant: 'destructive' }) }
      }}>
        <Input value={suggest} onChange={e => setSuggest(e.target.value)} maxLength={80} placeholder="Свой вариант" aria-label="Свой вариант" />
        <Button variant="outline" disabled={!suggest.trim()}>Добавить</Button>
      </form>
    )}
    <p className="text-sm text-muted-foreground">
      {closed ? 'Голосование закрыто · ' : ''}
      {showResults ? `Голосов: ${result?.total ?? 0}` : s.results === 'owner' ? 'Результаты увидит только организатор' : 'Результаты откроются после голоса'}
    </p>
    {owner && (result?.guestOptions ?? []).length > 0 && (
      <div className="space-y-1.5 border-t pt-3">
        <p className="text-xs font-semibold text-muted-foreground">Варианты от гостей</p>
        {(result?.guestOptions ?? []).map(o => <div key={o.id} className={cn('flex items-center justify-between gap-2 text-sm', o.hidden && 'opacity-50')}>
          {o.text}
          <Button size="sm" variant="ghost" onClick={async () => { try { await api.put(`wishlists/poll-options/${o.id}/hidden`, { hidden: !o.hidden }); await q.refresh() } catch { toast({ title: 'Не удалось изменить', variant: 'destructive' }) } }}>{o.hidden ? 'Показать' : 'Скрыть'}</Button>
        </div>)}
      </div>
    )}
    <ErrorText error={q.error || q.mutation.error} />
  </div>
}

function PlaylistView({ block, wishlistId, owner }: Props) {
  const q = useGuestData<PlaylistTrack[]>(wishlistId, block.id, 'playlist')
  const [pending, setPending] = useState(false)
  return <div className="space-y-4">{q.result?.map(track => <div key={track.id} className="flex items-center justify-between gap-3 border-b py-3"><span>{track.title}</span>{block.data.votes !== false && <Button variant={track.votedByMe ? 'default' : 'outline'} aria-label={`Голос за ${track.title}`} disabled={pending} onClick={async () => { setPending(true); try { await api.put(`wishlists/${wishlistId}/playlist/${track.id}/vote`, {}); await q.refresh() } catch { toast({ title: 'Не удалось сохранить голос', variant: 'destructive' }) } finally { setPending(false) } }}>▲ {track.votes}</Button>}</div>)}
    <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); q.mutation.mutate({ title: f.get('title') }, { onSuccess: () => form.reset() }) }}><Input name="title" aria-label="Исполнитель и трек" placeholder="Исполнитель — название трека" required maxLength={120} className="min-w-40 flex-1" /><Button disabled={q.mutation.isPending}>Предложить трек</Button></form>
    {owner && <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText((q.result ?? []).map(t => `${t.title} (${t.votes})`).join('\n')); toast({ title: 'Список треков скопирован' }) } catch { toast({ title: 'Не удалось скопировать', variant: 'destructive' }) } }}>Выгрузить списком</Button>}<ErrorText error={q.error || q.mutation.error} />
  </div>
}

/** Поздравления — только текст: фото от гостей не принимаем (решение по макету). */
function GuestbookView({ block, wishlistId, owner }: Props) {
  const q = useGuestData<GuestbookEntry[]>(wishlistId, block.id, 'guestbook', owner)
  const [pending, setPending] = useState(false)
  return <div className="space-y-4">{q.result?.map(entry => <article key={entry.id} className={cn('space-y-2 rounded-xl border bg-background/40 p-4', entry.hidden && 'opacity-50')}><p className="font-semibold">{entry.name || 'Гость'}{entry.hidden && ' · скрыто'}</p><p className="whitespace-pre-wrap break-words">{entry.text}</p>{owner && <Button size="sm" variant="ghost" disabled={pending} onClick={async () => { setPending(true); try { await api.put(`wishlists/guestbook/${entry.id}/hidden`, { hidden: !entry.hidden }); await q.refresh() } catch { toast({ title: 'Не удалось изменить видимость', variant: 'destructive' }) } finally { setPending(false) } }}>{entry.hidden ? 'Показать' : 'Скрыть'}</Button>}</article>)}
    {!owner && <form className="space-y-3" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); q.mutation.mutate({ name: f.get('name'), text: f.get('text'), photoUrl: '' }, { onSuccess: () => form.reset() }) }}><Input name="name" aria-label="Ваше имя" placeholder="Ваше имя" maxLength={60} required /><Textarea name="text" aria-label="Поздравление" placeholder="Пара тёплых слов" maxLength={1000} required /><Button disabled={q.mutation.isPending}>Оставить поздравление</Button></form>}<ErrorText error={q.error || q.mutation.error} />
  </div>
}
