import { formatBudget, formatDay, formatDrawAt, participantsLabel } from '@/shared/santa'

const CHIP = 'flex h-control-sm items-center rounded-tag px-3 text-label font-semibold'

export function RoomChips({ budget, exchangeDate, drawAt, participantsCount }: {
  budget: number | null
  exchangeDate: string | null
  /** Только пока жеребьёвка впереди. */
  drawAt?: string | null
  participantsCount?: number
}) {
  const day = formatDay(exchangeDate)
  const draw = formatDrawAt(drawAt ?? null)
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`${CHIP} bg-tone-pink/15 text-tone-pink`}>{formatBudget(budget)}</span>
      {day && <span className={`${CHIP} bg-tone-gold/15 text-tone-gold`}>обмен {day}</span>}
      {draw && <span className={`${CHIP} bg-secondary text-muted-foreground`}>жеребьёвка {draw}</span>}
      {participantsCount !== undefined && (
        <span className={`${CHIP} bg-secondary text-muted-foreground`}>{participantsLabel(participantsCount)}</span>
      )}
    </div>
  )
}
