'use client'

import { useEffect, type RefObject } from 'react'

/**
 * Красит html, body и панели мобильного браузера в фон схемы вишлиста.
 *
 * Схема живёт на обёртке страницы, а за её пределами — при оттягивании
 * страницы, под панелями браузера и в «чёлке» — виден фон сайта. Берём
 * вычисленный цвет обёртки: так работает и для «своей схемы», у которой нет
 * класса, только CSS-переменные. Уходя со страницы, возвращаем как было.
 */
export function usePageBackground(ref: RefObject<HTMLElement | null>, enabled: boolean, key: string) {
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return

    const color = getComputedStyle(el).backgroundColor
    const { documentElement: html, body } = document
    const prev = { html: html.style.backgroundColor, body: body.style.backgroundColor }
    html.style.backgroundColor = color
    body.style.backgroundColor = color

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    const created = !meta
    const prevMeta = meta?.content
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color

    return () => {
      html.style.backgroundColor = prev.html
      body.style.backgroundColor = prev.body
      if (created) meta.remove()
      else if (prevMeta !== undefined) meta.content = prevMeta
    }
  }, [ref, enabled, key])
}
