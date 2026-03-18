"use client";

import Link from "next/link";
import Particles from "@/components/ui/particles";
import SplashCursor from "@/components/ui/splash-cursor";
import BlurText from "@/components/ui/blur-text";
import { useTheme } from "next-themes";

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? [
                "radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.2) 0%, transparent 50%)",
                "radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.3) 0%, transparent 50%)",
                "radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.12) 0%, transparent 40%)",
                "#000d1a",
              ].join(", ")
            : [
                "radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.07) 0%, transparent 50%)",
                "radial-gradient(ellipse at 80% 30%, rgba(139,92,246,0.08) 0%, transparent 50%)",
                "radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.04) 0%, transparent 40%)",
                "#f8faff",
              ].join(", "),
        }}
      />

      {/* Particles — behind content */}
      <Particles
        className="absolute inset-0 z-0"
        particleCount={80}
        particleColors={isDark ? ["#a5f3fc", "#c4b5fd"] : ["#06b6d4", "#8b5cf6"]}
        particleBaseSize={60}
      />

      {/* Splash cursor — global fixed overlay */}
      <SplashCursor
        SPLAT_RADIUS={0.1}
        SPLAT_FORCE={2500}
        DENSITY_DISSIPATION={3.5}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-3xl mx-auto">
        {/* Badge */}
        <div
          className="inline-flex items-center px-4 py-1.5 rounded-full text-xs tracking-widest font-medium"
          style={{
            background: "rgba(139,92,246,0.12)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: isDark ? "#c4b5fd" : "#7c3aed",
          }}
        >
          ✦ бесплатно · красиво · навсегда
        </div>

        {/* Headline */}
        <div className="flex flex-col items-center gap-1">
          <BlurText
            text="Твои мечты заслуживают"
            className={`text-5xl md:text-6xl font-black leading-tight tracking-tight ${isDark ? "text-[#f0f9ff]" : "text-[#0f172a]"}`}
            delay={100}
            animateBy="words"
          />
          <span className="bg-gradient-to-r from-[#06b6d4] via-[#8b5cf6] to-[#10b981] bg-clip-text text-transparent">
            <BlurText
              text="красивого списка."
              className={`text-5xl md:text-6xl font-black leading-tight tracking-tight ${isDark ? "text-[#f0f9ff]" : "text-[#0f172a]"}`}
              delay={300}
              animateBy="words"
            />
          </span>
        </div>

        {/* Subtext */}
        <p
          className="text-base md:text-lg max-w-md leading-relaxed"
          style={{ color: isDark ? "#94a3b8" : "#64748b" }}
        >
          Намекни на то, чего хочешь — собери в список и отправь ссылку.{" "}
          <span>Никаких неловких разговоров о подарках.</span>
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/wishlist"
            className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-transform hover:scale-[1.03]"
            style={{
              background: "linear-gradient(135deg, #06b6d4, #8b5cf6)",
              boxShadow: "0 0 24px rgba(6,182,212,0.35)",
            }}
          >
            Создать вишлист ✦
          </Link>
          <Link
            href="/wishlist-for"
            className="px-8 py-3.5 rounded-xl font-semibold text-base transition-all hover:text-[#c4b5fd]"
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.12)"
                : "1px solid rgba(0,0,0,0.12)",
              color: isDark ? "#94a3b8" : "#475569",
            }}
          >
            Смотреть пример
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="flex flex-col items-center gap-2 mt-6 pointer-events-none select-none">
          <div
            className="w-px h-8 animate-pulse"
            style={{
              background:
                "linear-gradient(to bottom, rgba(6,182,212,0.6), transparent)",
            }}
          />
          <span
            className="text-[10px] tracking-widest uppercase"
            style={{ color: isDark ? "#1e3a4a" : "#94a3b8" }}
          >
            листай вниз
          </span>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(to bottom, transparent, #000d1a)"
            : "linear-gradient(to bottom, transparent, #f0fdf4)",
        }}
      />
    </section>
  );
}
