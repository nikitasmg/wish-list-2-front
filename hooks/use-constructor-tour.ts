'use client'

import { useEffect } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'constructor_tour_seen'

export function useConstructorTour() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(TOUR_KEY)) return

    const markSeen = () => localStorage.setItem(TOUR_KEY, 'true')

    const driverObj = driver({
      animate: true,
      overlayOpacity: 0.6,
      smoothScroll: true,
      allowClose: true,
      showProgress: false,
      popoverClass: 'constructor-tour',
      nextBtnText: 'Далее →',
      prevBtnText: '← Назад',
      doneBtnText: 'Готово ✓',
      showButtons: ['next', 'close'],
      onDestroyed: markSeen,
      steps: [
        {
          element: '[data-tour="title"]',
          popover: {
            title: '✏️ Придумай название',
            description: 'Здесь можно назвать вишлист — «День рождения», «Свадьба», что угодно.',
            side: 'bottom',
            align: 'start',
          },
        },
        {
          element: '[data-tour="block-palette"]',
          popover: {
            title: '🧩 Добавляй блоки',
            description: 'Нажми на любой блок — текст, фото, дата, место — и он появится в вишлисте.',
            side: 'right',
            align: 'start',
          },
        },
        {
          element: '[data-tour="block-canvas"]',
          popover: {
            title: '✋ Меняй и перемещай',
            description: 'Нажми блок чтобы выделить, дважды — чтобы изменить. Зажми и перетащи в другое место.',
            side: 'left',
            align: 'start',
          },
        },
        {
          element: '[data-tour="tab-presents"]',
          popover: {
            title: '🎁 Добавляй подарки',
            description: 'Во вкладке «Подарки» добавляй то, что хочешь получить — с ссылками и ценами.',
            side: 'bottom',
            align: 'start',
          },
        },
      ],
    })

    // Delay so that all DOM elements with data-tour attributes are mounted
    const timer = setTimeout(() => driverObj.drive(), 600)
    return () => {
      clearTimeout(timer)
      driverObj.destroy()
    }
  }, [])
}
