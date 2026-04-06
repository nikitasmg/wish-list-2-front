'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'constructor_tour_seen'

const TOUR_CONFIG = {
  animate: true,
  overlayOpacity: 0.85,
  smoothScroll: true,
  allowClose: true,
  showProgress: false,
  stagePadding: 4,
  stageRadius: 8,
  popoverClass: 'constructor-tour',
  nextBtnText: 'Далее →',
  prevBtnText: '← Назад',
  doneBtnText: 'Готово ✓',
  showButtons: ['next', 'close'] as ('next' | 'previous' | 'close')[],
  steps: [
    {
      element: '[data-tour="title"]',
      popover: {
        title: '✏️ Придумай название',
        description: 'Здесь можно назвать вишлист — «День рождения», «Свадьба», что угодно.',
        side: 'bottom' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="block-palette"]',
      popover: {
        title: '🧩 Добавляй блоки',
        description: 'Нажми на любой блок — текст, фото, дата, место — и он появится в вишлисте.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="block-canvas"]',
      popover: {
        title: '✋ Меняй и перемещай',
        description: 'Нажми блок чтобы выделить, дважды — чтобы изменить. Зажми и перетащи в другое место.',
        side: 'left' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="tab-presents"]',
      popover: {
        title: '🎁 Добавляй подарки',
        description: 'Во вкладке «Подарки» добавляй то, что хочешь получить — с ссылками и ценами.',
        side: 'bottom' as const,
        align: 'start' as const,
      },
    },
  ],
}

function runTour() {
  const markSeen = () => localStorage.setItem(TOUR_KEY, 'true')
  const driverObj = driver({ ...TOUR_CONFIG, onDestroyed: markSeen })
  driverObj.drive()
  return driverObj
}

export function useConstructorTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(TOUR_KEY)) return

    const timer = setTimeout(() => runTour(), 600)
    return () => clearTimeout(timer)
  }, [])

  const startTour = () => {
    localStorage.removeItem(TOUR_KEY)
    runTour()
  }

  return { startTour }
}
