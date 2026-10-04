import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'
import type { Config } from 'tailwindcss'

export default {
  darkMode: [ 'class' ],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    /*
     * Дизайн-система (docs/design-system.md): токены названы по роли и
     * заменяют стоковые шкалы целиком — text-sm, rounded-lg, shadow-md,
     * duration-200 больше не существуют.
     * Трекинг и интерлиньяж зашиты в кегль — отрицательный трекинг растёт
     * по модулю вместе с размером, иначе крупный заголовок рассыпается на
     * буквы. Вес задают только заголовки: у текста он ставится рядом.
     */
    fontSize: {
      // У текста трекинг явно 0: иначе он наследует отрицательный трекинг
      // заголовка-родителя и пробелы между словами схлопываются.
      'micro':      [ '0.6875rem', { lineHeight: '1.3',  letterSpacing: '0' } ],
      'eyebrow':    [ '0.6875rem', { lineHeight: '1.3',  letterSpacing: '0.08em',   fontWeight: '700' } ],
      'caption':    [ '0.75rem',   { lineHeight: '1.4',  letterSpacing: '0' } ],
      'label':      [ '0.8125rem', { lineHeight: '1.4',  letterSpacing: '0' } ],
      'body-sm':    [ '0.875rem',  { lineHeight: '1.5',  letterSpacing: '0' } ],
      'body':       [ '0.9375rem', { lineHeight: '1.5',  letterSpacing: '0' } ],
      'lead':       [ '1rem',      { lineHeight: '1.5',  letterSpacing: '0' } ],
      // Крупный абзац — блок «Текст» размера «Крупный», цитата. Не заголовок: без веса.
      'body-lg':    [ '1.25rem',   { lineHeight: '1.5',  letterSpacing: '0' } ],
      'title-xs':   [ '1.0625rem', { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '700' } ],
      'title-sm':   [ '1.25rem',   { lineHeight: '1.25', letterSpacing: '-0.02em',  fontWeight: '800' } ],
      'title':      [ '1.5rem',    { lineHeight: '1.2',  letterSpacing: '-0.02em',  fontWeight: '800' } ],
      'title-lg':   [ '2rem',      { lineHeight: '1.1',  letterSpacing: '-0.03em',  fontWeight: '800' } ],
      'display-sm': [ '2.75rem',   { lineHeight: '1.03', letterSpacing: '-0.033em', fontWeight: '800' } ],
      'display-md': [ '3.5rem',    { lineHeight: '1.02', letterSpacing: '-0.04em',  fontWeight: '800' } ],
      'display':    [ '4rem',      { lineHeight: '1',    letterSpacing: '-0.04em',  fontWeight: '800' } ],
      'display-xl': [ '7rem',      { lineHeight: '1',    letterSpacing: '-0.045em', fontWeight: '800' } ],
    },
    /*
     * Скругление растёт с размером элемента. Вложенное = внешнее − отступ.
     * block — блоки страницы гостя: у каждой схемы свой --radius.
     */
    borderRadius: {
      none: '0',
      full: '9999px',
      'xs': '4px',
      'tag': '8px',
      'control': '10px',
      'control-lg': '14px',
      'card': '18px',
      'sheet': '24px',
      'block': 'var(--radius)',
      'block-sm': 'calc(var(--radius) - 4px)',
    },
    boxShadow: {
      none: 'none',
      float: '0 16px 40px rgb(0 0 0 / var(--shadow-alpha))',
      overlay: '0 32px 96px rgb(0 0 0 / var(--shadow-alpha-strong))',
      ring: '0 0 0 2px hsl(var(--ring))',
      // Место вставки при перетаскивании — линия сверху
      drop: 'inset 0 2px 0 hsl(var(--primary))',
    },
    transitionDuration: { DEFAULT: '150ms', 0: '0ms', fast: '120ms', base: '200ms', slow: '320ms' },
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        // Фирменная палитра — одинаковая в обеих темах (макет). Только для
        // лендинга и иллюстраций; интерфейс красится ролями схемы.
        brand: {
          cyan: '#22C3E6',
          sky: '#17B6D6',
          violet: '#7B5CF0',
          ink: '#04202A',
          night: '#070B16',
          chat: '#2A4BB8',
        },
        // Тона иконок и плашек: на светлом темнее, на тёмном светлее.
        tone: {
          cyan: 'hsl(var(--tone-cyan) / <alpha-value>)',
          violet: 'hsl(var(--tone-violet) / <alpha-value>)',
          pink: 'hsl(var(--tone-pink) / <alpha-value>)',
        },
        // Подложка модалок и шторок
        overlay: 'rgb(var(--overlay) / 0.72)',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      backgroundImage: {
        // Главная кнопка: градиент от акцентов схемы
        // Главная кнопка интерфейса — градиент бренда, один для обеих тем (макет).
        'brand': 'linear-gradient(90deg, #17B6D6, #7B5CF0)',
        // Шапка объявлений: ночное небо бренда и светлый точечный узор поверх
        'hero-night': 'linear-gradient(135deg, #0F3B4A, #2A1F5C)',
        'dots': 'radial-gradient(rgba(255,255,255,0.12) 1.4px, transparent 2px)',
        // Свечения за первым экраном лендинга
        'glow-cyan': 'radial-gradient(closest-side, rgba(23,182,214,0.16), transparent)',
        'glow-violet': 'radial-gradient(closest-side, rgba(123,92,240,0.2), transparent)',
        'heart': "url('/icons/heart.svg')",
        'star': "url('/icons/star.svg')",
        'party': "url('/icons/party.svg')",
        'cat': "url('/icons/cat.svg')",
        'dog': "url('/icons/dog.svg')",
        'sun': "url('/icons/sun.svg')",
      },
      fontFamily: {
        manrope: [ 'var(--font-manrope)', 'system-ui', 'sans-serif' ],
        // Заголовки главной — тот же «Акцидент», что в «Оформлении».
        unbounded: [ 'var(--font-unbounded)', 'var(--font-manrope)', 'sans-serif' ],
      },
      // Высоты элементов управления: h-control, size-control-sm и т.д.
      spacing: {
        'control-sm': '2rem',
        'control': '2.5rem',
        'control-lg': '3rem',
        'control-xl': '3.5rem',
      },
      transitionTimingFunction: { 'out-soft': 'cubic-bezier(.22, 1, .36, 1)' },
    },
  },
  plugins: [ tailwindcssAnimate, typography ],
} satisfies Config
