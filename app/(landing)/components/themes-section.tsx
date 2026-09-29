"use client";

import BounceCards from "@/components/ui/bounce-cards";
import { useTheme } from "next-themes";

const THEME_IMAGES = [
  "https://placehold.co/160x200/1a0040/c4b5fd?text=Cosmos",
  "https://placehold.co/160x200/1a0020/f9a8d4?text=Rose",
  "https://placehold.co/160x200/000d1a/a5f3fc?text=Aurora",
];

export function ThemesSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <section
      className="relative py-12 md:py-24 px-4 overflow-x-hidden"
      style={{ background: isDark ? "#050b15" : "#faf8ff" }}
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          style={{ color: isDark ? "#c4b5fd" : "#7c3aed" }}
        >
          Красивые темы для любого случая
        </h2>
        <p style={{ color: isDark ? "#475569" : "#64748b" }} className="mb-8 md:mb-12">
          10 цветовых схем — найди свою
        </p>

        <div className="flex justify-center">
          <div className="scale-[0.65] sm:scale-100 origin-center -my-11 sm:my-0">
            <BounceCards
              images={THEME_IMAGES}
              containerWidth={500}
              containerHeight={250}
              animationDelay={0.1}
              animationStagger={0.08}
              enableHover
            />
          </div>
        </div>
      </div>
    </section>
  );
}
