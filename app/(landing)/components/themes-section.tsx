"use client";

import BounceCards from "@/components/ui/bounce-cards";

const THEME_IMAGES = [
  "https://placehold.co/160x200/1a0040/c4b5fd?text=Cosmos",
  "https://placehold.co/160x200/1a0020/f9a8d4?text=Rose",
  "https://placehold.co/160x200/000d1a/a5f3fc?text=Aurora",
];

export function ThemesSection() {
  return (
    <section className="relative py-24 px-4" style={{ background: "#050b15" }}>
      <div className="max-w-4xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-black tracking-tight mb-2"
          style={{ color: "#c4b5fd" }}
        >
          Красивые темы для любого случая
        </h2>
        <p className="text-[#475569] mb-12">10 цветовых схем — найди свою</p>

        <div className="flex justify-center">
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
    </section>
  );
}
