"use client";

import GlareHover from "@/components/ui/glare-hover";
import AnimatedContent from "@/components/ui/animated-content";
import FadeContent from "@/components/ui/fade-content";
import { useTheme } from "next-themes";

const BLOCKS = [
  {
    icon: "📝",
    label: "Текст",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.2)",
    lightBg: "rgba(6,182,212,0.07)",
    lightBorder: "rgba(6,182,212,0.3)",
    text: "#a5f3fc",
    lightText: "#0891b2",
  },
  {
    icon: "🖼️",
    label: "Фото",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.2)",
    lightBg: "rgba(139,92,246,0.07)",
    lightBorder: "rgba(139,92,246,0.3)",
    text: "#c4b5fd",
    lightText: "#7c3aed",
  },
  {
    icon: "🎬",
    label: "Видео",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    lightBg: "rgba(16,185,129,0.07)",
    lightBorder: "rgba(16,185,129,0.3)",
    text: "#6ee7b7",
    lightText: "#059669",
  },
  {
    icon: "⏱️",
    label: "Таймер",
    bg: "rgba(217,70,239,0.08)",
    border: "rgba(217,70,239,0.2)",
    lightBg: "rgba(217,70,239,0.07)",
    lightBorder: "rgba(217,70,239,0.3)",
    text: "#f5d0fe",
    lightText: "#a21caf",
  },
  {
    icon: "📍",
    label: "Место",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
    lightBg: "rgba(251,146,60,0.07)",
    lightBorder: "rgba(251,146,60,0.3)",
    text: "#fed7aa",
    lightText: "#c2410c",
  },
  {
    icon: "✅",
    label: "Чеклист",
    bg: "rgba(6,182,212,0.06)",
    border: "rgba(6,182,212,0.15)",
    lightBg: "rgba(6,182,212,0.06)",
    lightBorder: "rgba(6,182,212,0.25)",
    text: "#7dd3fc",
    lightText: "#0284c7",
  },
  {
    icon: "🖼️",
    label: "Галерея",
    bg: "rgba(139,92,246,0.05)",
    border: "rgba(139,92,246,0.15)",
    lightBg: "rgba(139,92,246,0.05)",
    lightBorder: "rgba(139,92,246,0.25)",
    text: "#a5b4fc",
    lightText: "#6366f1",
  },
];

export function ConstructorSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <section
      className="relative py-12 md:py-24 px-4 overflow-x-hidden"
      style={{ background: isDark ? "#040e1a" : "#f0f9ff" }}
    >
      <div className="max-w-5xl mx-auto">
        <AnimatedContent direction="vertical" reverse={false} delay={0}>
          <div className="text-center mb-8 md:mb-12">
            <h2
              className="text-3xl md:text-4xl font-black tracking-tight mb-2"
              style={{ color: isDark ? "#a5f3fc" : "#0891b2" }}
            >
              Не просто список — твоя страница
            </h2>
            <p style={{ color: isDark ? "#475569" : "#64748b" }} className="text-base">
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
                    background: isDark ? block.bg : block.lightBg,
                    border: `1px solid ${isDark ? block.border : block.lightBorder}`,
                  }}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-sm">{block.icon}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isDark ? block.text : block.lightText }}
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
                background: isDark
                  ? "linear-gradient(180deg, #0a1628, #0d0025)"
                  : "linear-gradient(180deg, #ffffff, #f5f3ff)",
                border: isDark
                  ? "1px solid rgba(139,92,246,0.12)"
                  : "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: isDark
                    ? "linear-gradient(90deg, rgba(6,182,212,0.15), rgba(139,92,246,0.1))"
                    : "linear-gradient(90deg, rgba(6,182,212,0.08), rgba(139,92,246,0.06))",
                  borderLeft: "2px solid #06b6d4",
                }}
              >
                <p
                  className="text-sm font-bold"
                  style={{ color: isDark ? "#a5f3fc" : "#0891b2" }}
                >
                  День рождения Маши 🎂
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: isDark ? "#475569" : "#64748b" }}
                >
                  25 января · Жду вас!
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: isDark ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.06)",
                  borderLeft: "2px solid #8b5cf6",
                }}
              >
                <p className="text-xs" style={{ color: isDark ? "#c4b5fd" : "#7c3aed" }}>
                  🖼️ Обложка события
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: isDark ? "rgba(16,185,129,0.07)" : "rgba(16,185,129,0.06)",
                  borderLeft: "2px solid #10b981",
                }}
              >
                <p className="text-xs" style={{ color: isDark ? "#6ee7b7" : "#059669" }}>
                  ⏱️ До праздника: 12 дней
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: isDark ? "rgba(251,146,60,0.06)" : "rgba(251,146,60,0.05)",
                  borderLeft: "2px solid rgba(251,146,60,0.4)",
                }}
              >
                <p className="text-xs" style={{ color: isDark ? "#fed7aa" : "#c2410c" }}>
                  📍 Москва, Патриаршие пруды
                </p>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-center"
                style={{
                  border: isDark
                    ? "1px dashed rgba(6,182,212,0.15)"
                    : "1px dashed rgba(6,182,212,0.3)",
                }}
              >
                <p
                  className="text-xs"
                  style={{ color: isDark ? "#1e3a4a" : "#94a3b8" }}
                >
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
