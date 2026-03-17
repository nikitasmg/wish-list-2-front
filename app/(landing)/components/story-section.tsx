'use client'

import AnimatedContent from '@/components/ui/animated-content'

export function StorySection() {
  return (
    <section
      className="relative py-24 px-4"
      style={{
        background: 'linear-gradient(180deg, #000d1a 0%, #05111f 50%, #0a0020 100%)',
      }}
    >
      <div className="max-w-2xl mx-auto flex flex-col gap-0">

        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="flex gap-5 items-start">
            <span className="text-4xl flex-shrink-0 mt-1">😩</span>
            <div>
              <h3 className="text-xl font-bold text-[#e2e8f0] mb-2">
                &quot;Что тебе подарить?&quot;
              </h3>
              <p className="text-[#64748b] leading-relaxed">
                Этот вопрос каждый раз ставит в тупик. Отвечаешь &quot;всё нормально&quot; — получаешь что попало.
              </p>
            </div>
          </div>
        </AnimatedContent>

        <div
          className="w-px h-16 ml-[22px] mt-2 mb-2"
          style={{ background: 'linear-gradient(to bottom, rgba(139,92,246,0.5), transparent)' }}
        />

        <AnimatedContent direction="vertical" reverse={false} delay={0.15}>
          <div className="flex gap-5 items-start">
            <span className="text-4xl flex-shrink-0 mt-1">✨</span>
            <div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#a5f3fc' }}>
                Просто намекни — и всё
              </h3>
              <p className="text-[#94a3b8] leading-relaxed">
                Собери желания в красивый список и отправь ссылку.{' '}
                Друзья сами выбирают что подарить.
              </p>
            </div>
          </div>
        </AnimatedContent>

      </div>
    </section>
  )
}
