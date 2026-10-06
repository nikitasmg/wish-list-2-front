import type { SantaInvite } from '@/shared/types'
import { Star } from 'lucide-react'
import { RoomChips } from '../../../components/room-chips'

export function InviteHeader({ invite }: { invite: SantaInvite }) {
  return (
    <header className="santa-snow space-y-4 rounded-sheet border border-border px-6 py-8">
      <Star className="size-8 text-tone-gold" fill="currentColor" aria-hidden />
      {invite.organizerName && (
        <p className="text-body-sm text-muted-foreground">{invite.organizerName} зовёт вас в Тайного Санту</p>
      )}
      <h1 className="text-title md:text-title-lg">{invite.title}</h1>
      <RoomChips budget={invite.budget} exchangeDate={invite.exchangeDate} participantsCount={invite.participantsCount} />
      {invite.message && <p className="whitespace-pre-line text-body text-muted-foreground">{invite.message}</p>}
    </header>
  )
}
