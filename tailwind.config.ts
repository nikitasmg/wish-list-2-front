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
        // Пишется здесь, а не CSS-переменной на :root: переменная взяла бы
        // цвета корня, а не схемы элемента.
        'brand': 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))',
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
      /*
       * Дизайн-система (docs/design-system.md): токены названы по роли.
       * Трекинг и интерлиньяж зашиты в кегль — отрицательный трекинг растёт
       * по модулю вместе с размером, иначе крупный заголовок рассыпается на
       * буквы. Вес задают только заголовки: у текста он ставится рядом.
       */
      fontSize: {
        'micro':      [ '0.6875rem', { lineHeight: '1.3' } ],
        'eyebrow':    [ '0.6875rem', { lineHeight: '1.3',  letterSpacing: '0.08em',   fontWeight: '700' } ],
        'caption':    [ '0.75rem',   { lineHeight: '1.4' } ],
        'label':      [ '0.8125rem', { lineHeight: '1.4' } ],
        'body-sm':    [ '0.875rem',  { lineHeight: '1.5' } ],
        'body':       [ '0.9375rem', { lineHeight: '1.5' } ],
        'lead':       [ '1rem',      { lineHeight: '1.5' } ],
        'title-xs':   [ '1.0625rem', { lineHeight: '1.3',  letterSpacing: '-0.01em',  fontWeight: '700' } ],
        'title-sm':   [ '1.25rem',   { lineHeight: '1.25', letterSpacing: '-0.02em',  fontWeight: '800' } ],
        'title':      [ '1.5rem',    { lineHeight: '1.2',  letterSpacing: '-0.02em',  fontWeight: '800' } ],
        'title-lg':   [ '2rem',      { lineHeight: '1.1',  letterSpacing: '-0.03em',  fontWeight: '800' } ],
        'display-sm': [ '2.75rem',   { lineHeight: '1.03', letterSpacing: '-0.033em', fontWeight: '800' } ],
        'display':    [ '4rem',      { lineHeight: '1',    letterSpacing: '-0.04em',  fontWeight: '800' } ],
        'display-xl': [ '7rem',      { lineHeight: '1',    letterSpacing: '-0.045em', fontWeight: '800' } ],
      },
      /*
       * Скругление растёт с размером элемента. Вложенное = внешнее − отступ.
       * block — блоки страницы гостя: у каждой схемы свой --radius.
       */
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        'xs': '4px',
        'tag': '8px',
        'control': '10px',
        'control-lg': '14px',
        'card': '18px',
        'sheet': '24px',
        'block': 'var(--radius)',
        'block-sm': 'calc(var(--radius) - 4px)',
      },
      // Высоты элементов управления: h-control, size-control-sm и т.д.
      spacing: {
        'control-sm': '2rem',
        'control': '2.5rem',
        'control-lg': '3rem',
        'control-xl': '3.5rem',
      },
      boxShadow: {
        float: '0 16px 40px rgb(0 0 0 / var(--shadow-alpha))',
        overlay: '0 32px 96px rgb(0 0 0 / var(--shadow-alpha-strong))',
        ring: '0 0 0 2px hsl(var(--ring))',
      },
      transitionDuration: { fast: '120ms', base: '200ms', slow: '320ms' },
      transitionTimingFunction: { 'out-soft': 'cubic-bezier(.22, 1, .36, 1)' },
    },
  },
  plugins: [ tailwindcssAnimate, typography ],
} satisfies Config
