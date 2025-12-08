import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { WishlistExample } from '@/components/wishlist-example'
import Link from 'next/link'
import Head from 'next/head'
import { PlusIcon, PaletteIcon, SparklesIcon, GiftIcon, LayoutTemplate } from 'lucide-react'

export default function Home() {

  return (
    <>
      <Head>
        <title>WishMaker — Создавайте красивые вишлисты бесплатно</title>
      </Head>

      <Header />

      <div className="min-h-screen bg-background text-foreground font-manrope relative overflow-hidden">

        {/* Градиенты */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-chart-5/20 blur-[180px]" />
          <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-chart-2/20 blur-[180px]" />
        </div>

        {/* ============================= */}
        {/*             HERO              */}
        {/* ============================= */}
        <section className="container mx-auto px-4 pt-16 md:pt-24 pb-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl mb-6">
              <SparklesIcon className="w-4 h-4 text-chart-1" />
              <span className="text-sm font-semibold">Быстро. Красиво. Бесплатно.</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight mb-4">
              Создавайте стильные{' '}
              <span className="bg-gradient-to-r from-chart-1 to-chart-5 text-transparent bg-clip-text">
                вишлисты
              </span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
              Сделайте подарки проще: добавляйте идеи, оформляйте тему и делитесь ссылкой с друзьями.
            </p>

            <div className="flex justify-center gap-4">
              <Link
                href="/wishlist"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-xl shadow-xl hover:shadow-2xl
                           hover:scale-[1.04] transition-all font-bold flex items-center gap-2 text-lg"
              >
                Начать <PlusIcon className="w-5 h-5" />
              </Link>

              <Link
                href="/how-it-works"
                className="px-8 py-4 rounded-xl border border-primary/40 bg-white/5 backdrop-blur-md
                           hover:bg-white/10 transition-all font-semibold text-primary"
              >
                Как это работает?
              </Link>
            </div>
          </div>

          {/* Улучшенный блок превью */}
          <div className="mt-14 flex justify-center">
            <div className="rounded-[30px] p-1 bg-gradient-to-br from-chart-1/40 to-chart-5/40 shadow-2xl border border-white/20">
              <div className="rounded-[26px] bg-background/60 backdrop-blur-xl p-6 shadow-xl">
                <WishlistExample />
              </div>
            </div>
          </div>
        </section>

        {/* ============================= */}
        {/*         HOW IT WORKS          */}
        {/* ============================= */}
        <section className="py-16 bg-popover/40 backdrop-blur-xl relative z-10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Как это работает</h2>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

              <div className="p-6 rounded-2xl bg-background/60 border border-white/10 backdrop-blur-lg shadow-lg text-center">
                <PlusIcon className="w-9 h-9 mx-auto mb-4 text-chart-5" />
                <h3 className="text-xl font-bold mb-2">Создайте список</h3>
                <p className="text-muted-foreground text-sm">Начните с пустого листа или шаблона.</p>
              </div>

              <div className="p-6 rounded-2xl bg-background/60 border border-white/10 backdrop-blur-lg shadow-lg text-center">
                <PaletteIcon className="w-9 h-9 mx-auto mb-4 text-chart-4" />
                <h3 className="text-xl font-bold mb-2">Настройте стиль</h3>
                <p className="text-muted-foreground text-sm">Выбирайте из готовых цветовых тем.</p>
              </div>

              <div className="p-6 rounded-2xl bg-background/60 border border-white/10 backdrop-blur-lg shadow-lg text-center">
                <GiftIcon className="w-9 h-9 mx-auto mb-4 text-chart-2" />
                <h3 className="text-xl font-bold mb-2">Поделитесь ссылкой</h3>
                <p className="text-muted-foreground text-sm">Друзья увидят ваш красивый список подарков.</p>
              </div>

            </div>
          </div>
        </section>
        {/* ============================= */}
        {/*        ADVANTAGES             */}
        {/* ============================= */}
        <section className="py-16 bg-popover relative z-10">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Почему GetMyWishlist?</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: SparklesIcon, text: "Красивые темы и визуалы" },
                { icon: LayoutTemplate, text: "Готовые шаблоны под любую ситуацию" },
                { icon: GiftIcon, text: "Удобно делиться и получать подарки" },
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-background/60 border border-white/10 backdrop-blur-xl shadow-lg text-center">
                  <item.icon className="w-10 h-10 mx-auto mb-4 text-chart-4" />
                  <p className="font-semibold text-lg">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================= */}
        {/*           FINAL CTA           */}
        {/* ============================= */}
        <section className="py-20 bg-gradient-to-br from-chart-3 to-chart-5 text-background relative z-10">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Готовы создать свой вишлист?
            </h2>

            <p className="text-lg text-background/80 mb-8">
              Это бесплатно, быстро и красиво.
            </p>

            <Link
              href="/wishlist"
              className="px-12 py-5 bg-background text-foreground text-xl rounded-2xl shadow-2xl
                         hover:scale-[1.05] transition-all font-bold"
            >
              Создать бесплатно →
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}
