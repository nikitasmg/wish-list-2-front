import { Block } from '@/shared/types'

export type WishlistTemplate = {
  id: string
  label: string
  category: string
  emoji: string
  colorScheme: string
  accentColor: string
  gradientFrom: string
  description: string
  buildBlocks: (title: string, date?: Date) => Block[]
}

function toLocalIso(date?: Date): string {
  const d = date ?? (() => {
    const n = new Date()
    n.setMonth(n.getMonth() + 3)
    return n
  })()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00:00`
}

export const templates: WishlistTemplate[] = [
  {
    id: 'birthday_boy',
    label: 'Для мальчика',
    category: 'День рождения',
    emoji: '🚀',
    colorScheme: 'cloud',
    accentColor: '#0284c7',
    gradientFrom: '#f0f9ff',
    description: 'Дата, место, программа, чеклист',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! 🎉 Приглашаем тебя на <strong>${title}</strong>! Приходи с хорошим настроением — всё остальное мы уже организовали.</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'agenda', row: 4, col: 0, colSpan: 2,
          data: {
            items: [
              { time: '12:00', text: 'Сбор гостей' },
              { time: '12:30', text: 'Игры и развлечения' },
              { time: '14:00', text: 'Праздничный стол и торт 🎂' },
              { time: '14:45', text: 'Вручение подарков' },
              { time: '15:30', text: 'Свободное время и фото' },
            ],
          },
        },
        {
          type: 'checklist', row: 5, col: 0, colSpan: 1,
          data: {
            title: 'Что взять с собой',
            items: [{ text: 'Хорошее настроение' }, { text: 'Подарок (список ниже 👇)' }],
          },
        },
        { type: 'divider', row: 6, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 7, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Мама именинника', telegram: '' } },
      ]
    },
  },
  {
    id: 'birthday_girl',
    label: 'Для девочки',
    category: 'День рождения',
    emoji: '🦄',
    colorScheme: 'blush',
    accentColor: '#e11d48',
    gradientFrom: '#fff1f2',
    description: 'Дата, место, программа, чеклист',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! 🎀 Приглашаем тебя на <strong>${title}</strong>! Будет красиво, вкусно и весело 🌸</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'agenda', row: 4, col: 0, colSpan: 2,
          data: {
            items: [
              { time: '13:00', text: 'Сбор гостей' },
              { time: '13:30', text: 'Игры и конкурсы 🎉' },
              { time: '15:00', text: 'Праздничный стол и торт 🎂' },
              { time: '15:45', text: 'Вручение подарков 🎁' },
              { time: '16:30', text: 'Фотосессия и свободное время' },
            ],
          },
        },
        {
          type: 'checklist', row: 5, col: 0, colSpan: 1,
          data: {
            title: 'Что взять с собой',
            items: [{ text: 'Хорошее настроение' }, { text: 'Подарок (список ниже 👇)' }],
          },
        },
        { type: 'divider', row: 6, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 7, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Мама именинницы', telegram: '' } },
      ]
    },
  },
  {
    id: 'birthday_man',
    label: 'Для него',
    category: 'День рождения',
    emoji: '🎯',
    colorScheme: 'cosmic',
    accentColor: '#8b5cf6',
    gradientFrom: '#08001a',
    description: 'Дата, место, цитата, контакты',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! Отмечаем <strong>${title}</strong> — будет по-настоящему круто. Приходи!</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'quote', row: 4, col: 0, colSpan: 2,
          data: { text: 'Лучший подарок — это время, проведённое вместе.' },
        },
        { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Контакт', telegram: '' } },
      ]
    },
  },
  {
    id: 'birthday_woman',
    label: 'Для неё',
    category: 'День рождения',
    emoji: '💐',
    colorScheme: 'lavender',
    accentColor: '#7c3aed',
    gradientFrom: '#faf5ff',
    description: 'Дата, место, цитата, контакты',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Привет! 💜 Отмечаем <strong>${title}</strong> — будет тепло, красиво и очень душевно. Ждём тебя!</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День рождения' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'quote', row: 4, col: 0, colSpan: 2,
          data: { text: 'Самый лучший день — это тот, когда рядом любимые люди.' },
        },
        { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Организатор', role: 'Контакт', telegram: '' } },
      ]
    },
  },
  {
    id: 'wedding',
    label: 'Свадьба',
    category: 'Свадьба',
    emoji: '💍',
    colorScheme: 'sand',
    accentColor: '#d97706',
    gradientFrom: '#fffbeb',
    description: 'Дата, место, программа, контакты',
    buildBlocks: (title, date) => {
      const dt = toLocalIso(date)
      return [
        {
          type: 'text', row: 0, col: 0, colSpan: 2,
          data: { html: `<p>Дорогие гости! 💍 Приглашаем вас разделить с нами этот особенный день — <strong>${title}</strong>. Нам важно, что вы будете рядом 🤍</p>` },
        },
        { type: 'date', row: 1, col: 0, colSpan: 1, data: { datetime: dt, label: 'День свадьбы' } },
        { type: 'location', row: 1, col: 1, colSpan: 1, data: { name: 'Место проведения' } },
        { type: 'timing', row: 2, col: 0, colSpan: 2, data: { end: dt } },
        { type: 'divider', row: 3, col: 0, colSpan: 2, data: { style: 'dots' } },
        {
          type: 'agenda', row: 4, col: 0, colSpan: 2,
          data: {
            items: [
              { time: '15:00', text: 'Сбор гостей' },
              { time: '16:00', text: 'Торжественная церемония' },
              { time: '17:00', text: 'Фуршет и фотосессия' },
              { time: '18:00', text: 'Праздничный банкет 🥂' },
            ],
          },
        },
        { type: 'divider', row: 5, col: 0, colSpan: 2, data: { style: 'line' } },
        { type: 'contact', row: 6, col: 0, colSpan: 1, data: { name: 'Жених', role: 'Организатор', telegram: '' } },
        { type: 'contact', row: 6, col: 1, colSpan: 1, data: { name: 'Невеста', role: 'Организатор', telegram: '' } },
      ]
    },
  },
]
