'use client'

import { ScrollVelocity } from '@/components/ui/scroll-velocity'
import { useTheme } from 'next-themes'

const ROW_1 = '🎁 новые кроссовки · 🎧 наушники мечты · 📚 книги на год · 🌿 путешествие · 💻 MacBook · 💍 украшения · 🎮 PlayStation · '
const ROW_2 = '🌸 цветы и уход · 🍾 ужин в ресторане · 🎨 курс рисования · 🏋️ абонемент · 📷 фотосессия · 🧴 skincare · 🎸 гитара · '

export function MarqueeSection() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== 'light'
  const bg = isDark ? '#000d1a' : '#f8fafc'

  return (
    <section
      className="relative py-16 overflow-hidden"
      style={{ background: bg }}
    >
      {/* Radial glow behind marquee */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
        style={{ background: `linear-gradient(to bottom, ${bg}, transparent)` }}
      />
      <div className="relative z-10">
        <ScrollVelocity
          texts={[ROW_1, ROW_2]}
          velocity={40}
          className="text-xl font-bold text-[#8b5cf6]"
        />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
        style={{ background: `linear-gradient(to top, ${bg}, transparent)` }}
      />
    </section>
  )
}
