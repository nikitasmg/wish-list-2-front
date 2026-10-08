'use client'

import { useApiGetMyProfile } from '@/api/user'
import { useApiGetAllWishlists } from '@/api/wishlist'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { wishlistOptions } from '@/shared/santa'
import { MAIN_ORIGIN } from '@/shared/santa-route'
import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'

export type WishlistOption = { title: string; url: string }

/** Свои вишлисты вошедшего пользователя; без входа — пусто. */
export function useMyWishlistOptions(): WishlistOption[] {
  const profile = useApiGetMyProfile()
  const signedIn = Boolean(profile.data?.user)
  const { data } = useApiGetAllWishlists(signedIn)
  return useMemo(() => (signedIn ? wishlistOptions(data?.data ?? [], MAIN_ORIGIN) : []), [signedIn, data])
}

const OPTION = 'flex min-h-control-lg w-full items-center gap-3 rounded-control-lg border px-4 py-2 text-left text-body transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

/** Вишлист из своих, без вишлиста или чужая ссылка. value — итоговая ссылка ('' — без вишлиста). */
export function WishlistPicker({ value, onChange, options }: {
  value: string
  onChange: (url: string) => void
  options: WishlistOption[]
}) {
  const own = options.some(o => o.url === value)
  const [custom, setCustom] = useState(value !== '' && !own)

  const pick = (url: string) => {
    setCustom(false)
    onChange(url)
  }
  const item = (selected: boolean) => cn(OPTION, selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50')

  return (
    <div role="group" aria-label="Вишлист" className="space-y-2">
      {options.map(o => (
        <button key={o.url} type="button" aria-pressed={value === o.url && !custom} className={item(value === o.url && !custom)} onClick={() => pick(o.url)}>
          <span className="flex-1 truncate font-semibold">{o.title}</span>
          {value === o.url && !custom && <Check className="size-4 text-primary" aria-hidden />}
        </button>
      ))}
      <button type="button" aria-pressed={!custom && value === ''} className={item(!custom && value === '')} onClick={() => pick('')}>
        <span className="flex-1">Без вишлиста</span>
      </button>
      <button type="button" aria-pressed={custom} className={item(custom)} onClick={() => { setCustom(true); if (own) onChange('') }}>
        <span className="flex-1">Другая ссылка</span>
      </button>
      {custom && (
        <Input
          type="url" inputMode="url" placeholder="https://…" aria-label="Ссылка на вишлист"
          value={value} onChange={e => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
