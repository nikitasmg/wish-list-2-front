'use client'

import { ScrollVelocity } from '@/components/ui/scroll-velocity'

const ROW_1 = '🎁 новые кроссовки · 🎧 наушники мечты · 📚 книги на год · 🌿 путешествие · 💻 MacBook · 💍 украшения · 🎮 PlayStation · '
const ROW_2 = '🌸 цветы и уход · 🍾 ужин в ресторане · 🎨 курс рисования · 🏋️ абонемент · 📷 фотосессия · 🧴 skincare · 🎸 гитара · '

export function MarqueeSection() {
  return (
    <section
      className="relative py-8 overflow-hidden"
      style={{ background: '#000d1a' }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-8 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, #000d1a, transparent)' }}
      />
      <ScrollVelocity
        texts={[ROW_1, ROW_2]}
        velocity={30}
        className="text-sm font-medium text-[#8b5cf6]"
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to top, #000d1a, transparent)' }}
      />
    </section>
  )
}
