/**
 * Конфетти при брони — «Живость» из «Оформления».
 *
 * Без библиотеки: два десятка цветных квадратиков с CSS-анимацией, которые
 * сами удаляются. Кто просил систему поменьше движения, конфетти не увидит.
 */
export function burstConfetti(anchor: Element) {
  if (typeof window === 'undefined') return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const rect = anchor.getBoundingClientRect()
  const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', '#FFD166', '#F9A8D4', '#7CC4FF', '#6EE7B7']
  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  Object.assign(layer.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '100', overflow: 'hidden' })
  const host = anchor.closest('.wishlist-page') ?? document.body
  host.appendChild(layer)
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('span')
    const angle = Math.random() * Math.PI * 2
    const distance = 80 + Math.random() * 160
    Object.assign(piece.style, {
      position: 'absolute',
      left: `${rect.left + rect.width / 2}px`,
      top: `${rect.top + rect.height / 2}px`,
      width: `${6 + Math.random() * 6}px`,
      height: `${4 + Math.random() * 6}px`,
      background: colors[i % colors.length],
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    })
    layer.appendChild(piece)
    piece.animate([
      { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 160}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
    ], { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' })
  }
  setTimeout(() => layer.remove(), 1800)
}
