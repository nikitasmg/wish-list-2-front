"use client";

import GlareHover from "@/components/ui/glare-hover";
import AnimatedContent from "@/components/ui/animated-content";
import FadeContent from "@/components/ui/fade-content";

const BLOCKS = [
  {
    icon: "📝",
    label: "Текст",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
    text: "#a5f3fc",
  },
  {
    icon: "🖼️",
    label: "Фото",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    text: "#c4b5fd",
  },
  {
    icon: "🎬",
    label: "Видео",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    text: "#6ee7b7",
  },
  {
    icon: "⏱️",
    label: "Таймер",
    bg: "rgba(217,70,239,0.08)",
    border: "rgba(217,70,239,0.2)",
    text: "#f5d0fe",
  },
  {
    icon: "📍",
    label: "Место",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
    text: "#fed7aa",
  },
  {
    icon: "✅",
    label: "Чеклист",
    bg: "rgba(6,182,212,0.06)",
    border: "rgba(6,182,212,0.15)",
    text: "#7dd3fc",
  },
  {
    icon: "🖼️",
    label: "Галерея",
    bg: "rgba(139,92,246,0.05)",
    border: "rgba(139,92,246,0.15)",
    text: "#a5b4fc",
  },
];

export function ConstructorSection() {
  return (
    <section className="relative py-24 px-4" style={{ background: "#040e1a" }}>
      <div className="max-w-5xl mx-auto">
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-2"
              style={{ color: "#a5f3fc" }}
            >
              Не просто список — твоя страница
            </h2>
            <p className="text-[#475569] text-base">
              Собирай из блоков всё что важно
            </p>
          </div>
        </AnimatedContent>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="flex flex-col gap-2">
            {BLOCKS.map((block, i) => (
              <AnimatedContent
                key={block.label}
                direction="horizontal"
                reverse={false}
                delay={i * 0.06}
              >
                <GlareHover
                  height="100px"
                  className="rounded-xl max-w-full cursor-default lg:max-w-[300px]"
                  style={{
                    background: block.bg,
                    border: `1px solid ${block.border}`,
                  }}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-sm">{block.icon}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: block.text }}
                    >
                      {block.label}
                    </span>
                  </div>
                </GlareHover>
              </AnimatedContent>
            ))}
          </div>

          <FadeContent blur duration={800} delay={200}>
            <div
              className="rounded-2xl p-5 flex flex-col gap-3"
              style={{
                background: "linear-gradient(180deg, #0a1628, #0d0025)",
                border: "1px solid rgba(139,92,246,0.12)",
              }}
            >
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))",
                  borderLeft: "2px solid #06b6d4",
                }}
              >
                <p className="text-sm font-bold" style={{ color: "#a5f3fc" }}>
                  День рождения Маши 🎂
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
                  25 января · Жду вас!
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(139,92,246,0.08)",
                  borderLeft: "2px solid #8b5cf6",
                }}
              >
                <p className="text-xs" style={{ color: "#c4b5fd" }}>
                  🖼️ Обложка события
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(16,185,129,0.07)",
                  borderLeft: "2px solid #10b981",
                }}
              >
                <p className="text-xs" style={{ color: "#6ee7b7" }}>
                  ⏱️ До праздника: 12 дней
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: "rgba(251,146,60,0.06)",
                  borderLeft: "2px solid rgba(251,146,60,0.4)",
                }}
              >
                <p className="text-xs" style={{ color: "#fed7aa" }}>
                  📍 Москва, Патриаршие пруды
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{ border: "1px dashed rgba(6,182,212,0.15)" }}
              >
                <p className="text-xs" style={{ color: "#1e3a4a" }}>
                  + добавь блок
                </p>
              </div>
            </div>
          </FadeContent>
        </div>
      </div>
    </section>
  );
}
