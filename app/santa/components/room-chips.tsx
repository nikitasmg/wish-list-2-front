import { formatBudget, formatDay, participantsLabel } from '@/shared/santa'

const CHIP = 'flex h-control-sm items-center rounded-tag px-3 text-label font-semibold'

export function RoomChips({ budget, exchangeDate, participantsCount }: {
  budget: number | null
  exchangeDate: string | null
  participantsCount?: number
}) {
  const day = formatDay(exchangeDate)
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`${CHIP} bg-tone-pink/15 text-tone-pink`}>{formatBudget(budget)}</span>
      {day && <span className={`${CHIP} bg-tone-gold/15 text-tone-gold`}>обмен {day}</span>}
      {participantsCount !== undefined && (
        <span className={`${CHIP} bg-secondary text-muted-foreground`}>{participantsLabel(participantsCount)}</span>
      )}
    </div>
  )
}
