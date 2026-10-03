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
        title: '🧩 Добавить блок',
        description: 'Плюс открывает библиотеку: программа, место, вишлист, ответы гостей. А «+» между блоками на странице вставляет блок прямо туда.',
        side: 'right' as const,
        align: 'start' as const,
      },
    },
    {
      element: '[data-tour="block-canvas"]',
      popover: {
        title: '✋ Правьте прямо на странице',
        description: 'Нажмите на блок — появится панель: выше, ниже, копия, удалить. Тяните блок между блоками или к краю соседа, чтобы поставить рядом. Текст правится на месте.',
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
